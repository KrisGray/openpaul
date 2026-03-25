---
title: Python API Project Tutorial
description: Build a gene API client using OpenPAUL's Plan-Apply-Unify Loop
---

# Python API Project Tutorial

Learn OpenPAUL by building a real project: a Python client that fetches gene information from the HGNC and NCBI Gene APIs using test-driven development.

**What you'll build:**
- Python client for HGNC REST API (`rest.genenames.org`)
- NCBI Gene API integration
- Full pytest test suite with mocks
- Test-driven development workflow with structured planning

**Prerequisites:**
- Python 3.10+
- [uv](https://docs.astral.sh/uv/) package manager
- OpenCode (for running `/openpaul:` commands)
- Basic understanding of REST APIs

---

## Step 1: Initialize the Project

```bash
# Create and initialize the project
mkdir gene-api-client
cd gene-api-client
uv init

# Add dependencies
uv add pytest pytest-mock requests

# Scaffold OpenPAUL
npx openpaul
```

`npx openpaul` creates two things:
- `.openpaul/state.json` — project registry (name, version, timestamps)
- `.opencode/` — OpenCode configuration and preset files

It does **not** create `PROJECT.md`, `ROADMAP.md`, or `STATE.md` — those are created in the next step.

---

## Step 2: Initialize OpenPAUL in OpenCode

Open the project in OpenCode, then run:

```
/openpaul:init
```

This initializes the loop state and starts a brief conversation. OpenPAUL asks two questions:

> "What's the core value this project delivers?"
>
> "What are you building? (1-2 sentences)"

Example answers:
- Core value: "Developers can look up gene metadata by HGNC ID in a single function call"
- Description: "A Python client library for querying the HGNC and NCBI Gene REST APIs"

After the conversation, OpenPAUL creates:
- `.openpaul/model-config.json` — model configuration
- `.openpaul/state-phase-1.json` — initial loop state
- `.openpaul/PROJECT.md` — project context (from conversation)
- `.openpaul/ROADMAP.md` — phase structure (skeleton for planning)
- `.openpaul/STATE.md` — loop position tracker
- `.openpaul/phases/` — directory for plans and summaries

You can now edit `.openpaul/ROADMAP.md` to define your phases, or leave it for the planner to fill in.

---

## Step 3: PLAN — Create First Plan

Run the plan command with structured parameters. OpenPAUL stores the plan as a JSON file in `.openpaul/phases/`.

```
/openpaul:plan --phase 1 --plan 01 \
  --criteria "fetch_by_hgnc_id returns gene data dict with symbol, name, entrez_id" \
  --criteria "network errors raise RequestException with context" \
  --criteria "all tests pass with 100% coverage of client code" \
  --tasks '[
    {"name": "Write failing test for HGNC fetch", "files": ["tests/test_hgnc_client.py"], "action": "Create TestHGNCClient class using mocker fixture to patch requests.get", "verify": "pytest tests/test_hgnc_client.py -v (expect failure)", "done": "Test file exists and test fails"},
    {"name": "Implement HGNCClient", "files": ["src/hgnc_client.py"], "action": "Implement fetch_by_hgnc_id with proper headers, timeout, and error handling", "verify": "pytest tests/test_hgnc_client.py -v", "done": "AC-1 and AC-2 satisfied"},
    {"name": "Add edge case tests", "files": ["tests/test_hgnc_client.py"], "action": "Test not-found (empty docs), network timeout, and malformed response", "verify": "pytest tests/test_hgnc_client.py --cov=src -v", "done": "AC-3 satisfied — 100% coverage"}
  ]'
```

OpenPAUL stores the plan at `.openpaul/phases/1-01-PLAN.json` and outputs a summary:

```
# 📋 Plan: 1-01

Type: execute | Wave: 1 | Tasks: 3
Structure: simple

## Criteria
- fetch_by_hgnc_id returns gene data dict with symbol, name, entrez_id
- network errors raise RequestException with context
- all tests pass with 100% coverage of client code

## Tasks
1. Write failing test for HGNC fetch: Test file exists and test fails
2. Implement HGNCClient: AC-1 and AC-2 satisfied
3. Add edge case tests: AC-3 satisfied — 100% coverage

Status: ✅ Plan created successfully
Location: .openpaul/phases/1-01-PLAN.json
Next action: Run /openpaul:apply to execute the plan
```

---

## Step 4: APPLY — Execute the Plan

```
/openpaul:apply
```

OpenPAUL displays each task in sequence with its action, verification step, and done criteria. Execute them one by one.

### Task 1: Write Failing Test

```python
# tests/test_hgnc_client.py
import pytest
import requests
from hgnc_client import HGNCClient


class TestHGNCClient:
    def test_fetch_gene_by_id_success(self, mocker):
        """Test successful gene fetch by HGNC ID."""
        mock_response = {
            "responseHeader": {"status": 0},
            "response": {
                "docs": [{
                    "hgnc_id": "HGNC:5",
                    "symbol": "A1BG",
                    "name": "alpha-1-B glycoprotein",
                    "entrez_id": "1"
                }]
            }
        }
        mock_get = mocker.patch("requests.get")
        mock_get.return_value = mocker.Mock(
            status_code=200,
            json=lambda: mock_response,
        )

        client = HGNCClient()
        result = client.fetch_by_hgnc_id("HGNC:5")

        assert result["symbol"] == "A1BG"
        assert result["entrez_id"] == "1"
        mock_get.assert_called_once_with(
            "https://rest.genenames.org/fetch/hgnc_id/HGNC:5",
            headers={"Accept": "application/json"},
            timeout=30,
        )
```

Verify: `pytest tests/test_hgnc_client.py -v` — test should fail (no implementation yet). ✓

### Task 2: Implement HGNCClient

```python
# src/hgnc_client.py
import requests
from typing import Optional, Dict, Any


class HGNCClient:
    BASE_URL = "https://rest.genenames.org"

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.headers = {"Accept": "application/json"}

    def fetch_by_hgnc_id(self, hgnc_id: str) -> Optional[Dict[str, Any]]:
        """Fetch gene data by HGNC ID.

        Args:
            hgnc_id: HGNC identifier (e.g., "HGNC:5")

        Returns:
            Gene data dictionary or None if not found

        Raises:
            requests.RequestException: On network errors
        """
        url = f"{self.BASE_URL}/fetch/hgnc_id/{hgnc_id}"

        try:
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            docs = response.json().get("response", {}).get("docs", [])
            return docs[0] if docs else None

        except requests.RequestException as e:
            raise requests.RequestException(f"Failed to fetch {hgnc_id}: {e}")
```

Verify: `pytest tests/test_hgnc_client.py -v` — AC-1 and AC-2 satisfied. ✓

### Task 3: Edge Case Tests

```python
# tests/test_hgnc_client.py (continued)

    def test_fetch_gene_not_found(self, mocker):
        """Test gene not found returns None."""
        mock_get = mocker.patch("requests.get")
        mock_get.return_value = mocker.Mock(
            status_code=200,
            json=lambda: {"responseHeader": {"status": 0}, "response": {"docs": []}},
        )
        client = HGNCClient()
        assert client.fetch_by_hgnc_id("HGNC:999999") is None

    def test_fetch_network_error(self, mocker):
        """Test network error raises exception."""
        mock_get = mocker.patch("requests.get")
        mock_get.side_effect = requests.ConnectionError("Network error")
        client = HGNCClient()
        with pytest.raises(requests.RequestException):
            client.fetch_by_hgnc_id("HGNC:5")
```

Verify: `pytest tests/test_hgnc_client.py --cov=src -v` — AC-3 satisfied. ✓

---

## Step 5: UNIFY — Close the Loop

```
/openpaul:unify --status success \
  --actuals '[
    {"name": "Write failing test for HGNC fetch", "status": "completed"},
    {"name": "Implement HGNCClient", "status": "completed"},
    {"name": "Add edge case tests", "status": "completed"}
  ]'
```

OpenPAUL closes the loop, writes `.openpaul/phases/1-01-SUMMARY.json`, and advances state ready for the next plan. Output:

```
# 🔗 Loop Closed: 1-01

## Summary
Status: ✅ success
Tasks: ████████████ completed

### Tasks Completed
1. ✅ Write failing test for HGNC fetch
2. ✅ Implement HGNCClient
3. ✅ Add edge case tests

## Next Steps
✅ Loop successfully closed
Ready for: Next loop iteration
Run: /openpaul:plan to start planning the next phase
```

---

## Step 6: Continue Development

### Phase 2: NCBI Integration

```
/openpaul:plan --phase 2 --plan 01 \
  --criteria "given an entrez_id, fetch_ncbi_gene returns gene details from NCBI" \
  --criteria "given an HGNC ID, fetch_full_gene returns combined data from both APIs" \
  --tasks '[
    {"name": "Write NCBI client tests", "files": ["tests/test_ncbi_client.py"], "action": "Create tests with mocker-patched requests for NCBI Entrez efetch API", "verify": "pytest tests/test_ncbi_client.py -v (expect failure)", "done": "Tests exist and fail"},
    {"name": "Implement NCBIClient", "files": ["src/ncbi_client.py"], "action": "Implement fetch_ncbi_gene using Entrez efetch API", "verify": "pytest tests/test_ncbi_client.py -v", "done": "AC-1 satisfied"},
    {"name": "Add combined lookup", "files": ["src/gene_client.py"], "action": "Implement GeneClient.fetch_full_gene combining HGNC + NCBI", "verify": "pytest tests/ -v", "done": "AC-2 satisfied"}
  ]'
```

Execute and close:

```
/openpaul:apply
/openpaul:unify
```

### Phase 3: CLI Tool

```
/openpaul:plan --phase 3 --plan 01 \
  --criteria "uv run gene-lookup HGNC:5 returns combined gene data" \
  --tasks '[{"name": "Implement CLI entry point", "files": ["src/cli.py"], "action": "Create CLI with argparse accepting --gene and --format options", "verify": "uv run python -m src.cli --gene HGNC:5", "done": "CLI returns JSON gene data"}]'
```
---

## Session Continuity
After a break:

```
/openpaul:resume
```

OpenPAUL loads your saved session, shows any file changes since you paused, and tells you exactly what to do next:

```
## 📋 Session Resume

Session ID: sess-...
Paused: 2024-01-15T14:30:00.000Z
Current Phase: 2 - APPLY

Work in Progress:
- Implementing NCBIClient.fetch_ncbi_gene

Next Steps:
- Resume task 2/3: Implement NCBIClient

📍 Loop: ✓ PLAN → ◉ APPLY → ○ UNIFY

Next Action: Run /openpaul:apply to execute the plan
```

---

## Summary

You've learned:
1. **Scaffold** — `npx openpaul` creates `.openpaul/state.json` and `.opencode/` config
2. **Initialize** — `/openpaul:init` sets up loop state and creates context files (`PROJECT.md`, `ROADMAP.md`, `STATE.md`)
3. **Plan** — `/openpaul:plan` creates structured JSON plans with criteria and tasks
4. **Apply** — `/openpaul:apply` displays tasks for sequential execution with verification
5. **Unify** — `/openpaul:unify` closes the loop and writes a JSON summary
6. **Resume** — `/openpaul:resume` restores context after breaks

The loop ensures:
- Every unit of work is planned with acceptance criteria
- Execution stays bounded by task verification
- State persists across sessions as JSON
- Decisions and summaries are logged
- No orphan plans
