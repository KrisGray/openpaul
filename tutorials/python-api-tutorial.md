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
- pytest installed
- Basic understanding of REST APIs

---

## Step 1: Initialize OpenPAUL

```bash
# Create project directory
mkdir gene-api-client
cd gene-api-client

# Initialize Python project
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install pytest pytest-mock requests

# Initialize OpenPAUL
npx openpaul
```

This creates the `.openpaul/` directory with:
- `PROJECT.md` — Project context
- `ROADMAP.md` — Phase breakdown
- `STATE.md` — Loop position

---

## Step 2: Create the Roadmap

Open `.openpaul/ROADMAP.md` and define your phases:

```markdown
# Roadmap

## Phase 1: HGNC Client
Implement the HGNC REST API client with TDD.

## Phase 2: NCBI Integration
Integrate NCBI Gene API using entrez_id from HGNC.

## Phase 3: CLI Tool
Create command-line interface for gene lookups.
```

---

## Step 3: PLAN — Create First Plan

```
/openpaul:plan
```

**You:** "I need to implement an HGNC API client that:
- Fetches gene data by HGNC ID
- Handles errors gracefully
- Is fully tested with mocked responses"

OpenPAUL generates `.openpaul/phases/01-hgnc-client/01-01-PLAN.md`:

```markdown
---
phase: 01-hgnc-client
plan: 01
type: execute
autonomous: true
---

<objective>
Implement HGNC REST API client with TDD for gene data lookups.
</objective>

<acceptance_criteria>

## AC-1: Fetch by HGNC ID

Given a valid HGNC ID (e.g., "HGNC:5")
When fetch_by_hgnc_id is called
Then return gene data dictionary with symbol, name, entrez_id

## AC-2: Error Handling

Given a network error or invalid response
When fetch_by_hgnc_id is called
Then raise appropriate exception with context

## AC-3: Test Coverage

Given the implementation is complete
When tests are run
Then all tests pass with 100% coverage of client code
</acceptance_criteria>

<tasks>
<task type="auto">
  <name>Write test for successful HGNC fetch</name>
  <files>tests/test_hgnc_client.py</files>
  <action>Create test class with mocked requests.get</action>
  <verify>pytest tests/test_hgnc_client.py -v</verify>
  <done>Test file exists, test fails (no implementation yet)</done>
</task>

<task type="auto">
  <name>Implement HGNCClient class</name>
  <files>src/hgnc_client.py</files>
  <action>Implement fetch_by_hgnc_id with proper headers and error handling</action>
  <verify>pytest tests/test_hgnc_client.py -v</verify>
  <done>AC-1 and AC-2 satisfied</done>
</task>

<task type="auto">
  <name>Add edge case tests</name>
  <files>tests/test_hgnc_client.py</files>
  <action>Test for not found, timeout, malformed response</action>
  <verify>pytest tests/test_hgnc_client.py --cov=src -v</verify>
  <done>AC-3 satisfied</done>
</task>
</tasks>

<boundaries>
## DO NOT CHANGE
- .openpaul/ROADMAP.md
- .openpaul/STATE.md
</boundaries>
```

---

## Step 4: APPLY — Execute the Plan

```
/openpaul:apply
```

OpenPAUL executes tasks sequentially:

### Task 1: Write Test

```python
# tests/test_hgnc_client.py
import pytest
from unittest.mock import Mock, patch
from hgnc_client import HGNCClient

class TestHGNCClient:
    def test_fetch_gene_by_id_success(self):
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
        
        with patch('requests.get') as mock_get:
            mock_get.return_value = Mock(
                status_code=200,
                json=lambda: mock_response
            )
            
            client = HGNCClient()
            result = client.fetch_by_hgnc_id("HGNC:5")
            
            assert result["symbol"] == "A1BG"
            assert result["entrez_id"] == "1"
            mock_get.assert_called_once_with(
                "https://rest.genenames.org/fetch/hgnc_id/HGNC:5",
                headers={"Accept": "application/json"}
            )
```

**OpenPAUL:** `✓ Task 1 complete: Test file created, test fails (expected)`

### Task 2: Implement Client

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
            
            data = response.json()
            docs = data.get("response", {}).get("docs", [])
            
            if docs:
                return docs[0]
            return None
            
        except requests.RequestException as e:
            raise requests.RequestException(f"Failed to fetch {hgnc_id}: {e}")
```

**OpenPAUL:** `✓ Task 2 complete: HGNCClient implemented, AC-1 and AC-2 satisfied`

### Task 3: Edge Cases

```python
# tests/test_hgnc_client.py (continued)
    
    def test_fetch_gene_not_found(self):
        """Test gene not found returns None."""
        mock_response = {
            "responseHeader": {"status": 0},
            "response": {"docs": []}
        }
        
        with patch('requests.get') as mock_get:
            mock_get.return_value = Mock(
                status_code=200,
                json=lambda: mock_response
            )
            
            client = HGNCClient()
            result = client.fetch_by_hgnc_id("HGNC:999999")
            
            assert result is None
    
    def test_fetch_network_error(self):
        """Test network error raises exception."""
        with patch('requests.get') as mock_get:
            mock_get.side_effect = requests.ConnectionError("Network error")
            
            client = HGNCClient()
            
            with pytest.raises(requests.RequestException):
                client.fetch_by_hgnc_id("HGNC:5")
```

**OpenPAUL:** `✓ Task 3 complete: All tests pass with 100% coverage, AC-3 satisfied`

**OpenPAUL:** `✓ All tasks complete! Run /openpaul:unify to close the loop.`

---

## Step 5: UNIFY — Close the Loop

```
/openpaul:unify
```

OpenPAUL creates SUMMARY.md and updates STATE.md:

```markdown
# Summary: HGNC Client

**Phase:** 01-hgnc-client
**Plan:** 01
**Completed:** 2024-01-15

## What Was Built
- HGNCClient class with fetch_by_hgnc_id method
- Full test suite with 3 test cases
- 100% code coverage

## Plan vs Actual
| Task | Planned | Actual | Status |
|------|---------|--------|--------|
| Write test | 1 file | 1 file | ✓ |
| Implement client | 1 file | 1 file | ✓ |
| Edge cases | 2 tests | 2 tests | ✓ |

## Decisions Made
1. Used requests library (standard for HTTP in Python)
2. Timeout defaults to 30 seconds
3. Returns None for not found (not exception)

## Issues Deferred
- None

## Next Phase
Phase 2: NCBI Integration
```

---

## Step 6: Continue Development

### Phase 2: NCBI Integration

```
/openpaul:plan

You: "Now integrate NCBI Gene API to fetch additional data using the entrez_id from HGNC results"
```

OpenPAUL creates a new plan in `02-ncbi-integration/`:

```markdown
<acceptance_criteria>

## AC-1: Fetch NCBI Data

Given an entrez_id from HGNC result
When fetch_ncbi_gene is called
Then return gene details from NCBI

## AC-2: Combined Lookup

Given an HGNC ID
When fetch_full_gene is called
Then return combined data from both APIs
</acceptance_criteria>
```

Execute and close:
```
/openpaul:apply
/openpaul:unify
```

### Phase 3: CLI Tool

```
/openpaul:plan

You: "Create a CLI tool that accepts a gene symbol and outputs combined data"
```

---

## Session Continuity

After a break:

```
/openpaul:resume
```

Output:
```
## Session Restored

**Last Session:** 2024-01-15
**Current Phase:** 03-cli-tool
**Status:** 2/4 tasks complete

**What's Next:**
Task 3: Add argument parsing with argparse
  File: src/cli.py
  Action: Implement CLI with --gene and --format options

**Suggested:** /openpaul:apply .openpaul/phases/03-cli-tool/03-01-PLAN.md
```

---

## Summary

You've learned:
1. **Initialize** — `npx openpaul` creates project structure
2. **Plan** — `/openpaul:plan` generates structured plans with AC and tasks
3. **Apply** — `/openpaul:apply` executes tasks with verification
4. **Unify** — `/openpaul:unify` closes the loop and preserves state
5. **Resume** — `/openpaul:resume` restores context after breaks

The loop ensures:
- Every unit of work is planned
- Execution stays bounded
- State persists across sessions
- Decisions are logged
- No orphan plans
