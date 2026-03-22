#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


README_PATH = Path("README.md")
START_MARKER = "<!-- changelog:start -->"
END_MARKER = "<!-- changelog:end -->"
MAX_DIFF_CHARS = 12000


def run_git_diff(base_sha: str, head_sha: str) -> str:
    cmd = ["git", "diff", "--name-status", f"{base_sha}...{head_sha}"]
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    names = result.stdout.strip()

    patch_cmd = ["git", "diff", f"{base_sha}...{head_sha}"]
    patch_result = subprocess.run(patch_cmd, check=True, capture_output=True, text=True)
    patch = patch_result.stdout

    if len(patch) > MAX_DIFF_CHARS:
        patch = patch[:MAX_DIFF_CHARS] + "\n\n[Diff truncated for summarization.]"

    return f"Changed files:\n{names}\n\nPatch:\n{patch}" if names else f"Patch:\n{patch}"


def generate_summary_with_models_api(token: str, model: str, prompt: str) -> str:
    url = "https://models.github.ai/inference/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a release assistant. "
                    "Return only one concise plain-text sentence (max 28 words) "
                    "that summarizes the PR changes for a README changelog."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": 0.2,
        "max_tokens": 80,
    }

    request = Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2026-03-10",
        },
        method="POST",
    )

    with urlopen(request, timeout=60) as response:
        body = json.loads(response.read().decode("utf-8"))

    choices = body.get("choices", [])
    if not choices:
        raise RuntimeError("Model response missing choices")

    message = choices[0].get("message", {})
    content = message.get("content", "").strip()
    if not content:
        raise RuntimeError("Model response content was empty")

    return " ".join(content.split())


def fallback_summary(pr_title: str) -> str:
    normalized = " ".join(pr_title.split())
    return f"Updated project content and documentation based on PR: {normalized}."


def update_readme(summary_line: str, pr_number: str, pr_url: str) -> None:
    if not README_PATH.exists():
        raise FileNotFoundError("README.md was not found")

    readme = README_PATH.read_text(encoding="utf-8")
    bullet = f"- PR #{pr_number}: {summary_line} ([link]({pr_url}))"

    if START_MARKER not in readme or END_MARKER not in readme:
        section = (
            "\n## Changelog\n\n"
            f"{START_MARKER}\n"
            f"{bullet}\n"
            f"{END_MARKER}\n"
        )
        readme = readme.rstrip() + "\n" + section
    else:
        start_index = readme.index(START_MARKER) + len(START_MARKER)
        end_index = readme.index(END_MARKER)
        body = readme[start_index:end_index]
        lines = [line for line in body.splitlines() if line.strip()]

        pr_prefix = f"- PR #{pr_number}:"
        lines = [line for line in lines if not line.startswith(pr_prefix)]
        lines.insert(0, bullet)

        new_body = "\n" + "\n".join(lines) + "\n"
        readme = readme[:start_index] + new_body + readme[end_index:]

    README_PATH.write_text(readme, encoding="utf-8")


def main() -> int:
    pr_number = os.getenv("PR_NUMBER", "")
    pr_title = os.getenv("PR_TITLE", "")
    pr_url = os.getenv("PR_URL", "")
    base_sha = os.getenv("BASE_SHA", "")
    head_sha = os.getenv("HEAD_SHA", "")
    model = os.getenv("COPILOT_MODEL", "openai/gpt-4.1")
    token = os.getenv("COPILOT_TOKEN", "")

    missing = [
        name
        for name, value in {
            "PR_NUMBER": pr_number,
            "PR_TITLE": pr_title,
            "PR_URL": pr_url,
            "BASE_SHA": base_sha,
            "HEAD_SHA": head_sha,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

    context = run_git_diff(base_sha, head_sha)
    prompt = (
        f"PR #{pr_number}: {pr_title}\n"
        f"URL: {pr_url}\n\n"
        "Summarize the change in one brief sentence for a changelog entry.\n\n"
        f"{context}"
    )

    summary = None
    if token:
        try:
            summary = generate_summary_with_models_api(token=token, model=model, prompt=prompt)
        except (HTTPError, URLError, TimeoutError, RuntimeError, ValueError) as exc:
            print(f"Model summary failed: {exc}. Using fallback.", file=sys.stderr)

    if not summary:
        summary = fallback_summary(pr_title)

    update_readme(summary_line=summary, pr_number=pr_number, pr_url=pr_url)
    print(f"README changelog updated for PR #{pr_number}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
