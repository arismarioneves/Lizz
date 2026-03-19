## Local Repo Connection

A local git repository is configured. Access it via the `LOCAL_REPO_PATH` env var.

```bash
# Get the path
node -e "console.log(process.env.LOCAL_REPO_PATH)"

# Work from the repo
cd "$LOCAL_REPO_PATH"
```

Run git operations, read/write files, and execute project commands from this path.
