# Bruno API collection

The shared iDeal API collection is maintained in the Backend repository:

`Backend/docs/api/bruno`

When the repositories are checked out together, this is available at:
`/home/mehroj/PycharmProjects/iDeal-Backend/docs/api/bruno`.

Browser documentation is generated from the same collection with Bruno's
native interactive HTML documentation runtime. Build it from the Backend
checkout with:

```bash
python3 .agents/skills/ideal-bruno/scripts/build_web_docs.py
```

The generated site is written to `docs/api/bruno/index.html` and can be
served by any static host. The Backend repository also includes a GitHub Pages
configuration that serves the committed `production` branch `/docs` folder.
The Backend repository uses the standard `pre-commit install` workflow to
regenerate the page before each commit.

Use the collection for executable requests, path/query fields, request bodies,
authentication requirements, and saved response fixtures. The Backend URL
resolver, view annotations, Pydantic schemas, tests, and response handling
remain the authoritative contract.

Open the `docs/api/bruno` folder in Bruno and switch between `Local`, `Dev`, and
`Prod` environments. Do not commit tokens, credentials, webhook secrets, or
local fixture paths. When an API contract changes, update the Backend
collection and the affected Frontend client/types/tests; do not create a
second Frontend copy of the collection.

For static checks, run from the Backend checkout:

```bash
uv run python .agents/skills/ideal-bruno/scripts/bruno_tool.py validate
```
