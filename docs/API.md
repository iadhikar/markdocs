# Markdocs API Reference

All endpoints return JSON. The base URL when running locally is `http://localhost:3000`.

## Spaces

### List all spaces

```
GET /api/spaces
```

**Response:** `200 OK`

```json
[
  {
    "id": "default",
    "name": "General",
    "slug": "general",
    "description": "Default workspace for your documents",
    "icon": "📚",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create a space

```
POST /api/spaces
Content-Type: application/json

{
  "name": "Engineering",
  "description": "Engineering documentation",
  "icon": "🔧"
}
```

**Response:** `201 Created`

### Get a space

```
GET /api/spaces/:id
```

Accepts either `id` or `slug`.

### Update a space

```
PUT /api/spaces/:id
Content-Type: application/json

{
  "name": "New Name",
  "description": "Updated description",
  "icon": "🚀"
}
```

All fields are optional -- only provided fields are updated.

### Delete a space

```
DELETE /api/spaces/:id
```

Deletes the space and all documents within it.

## Documents

### List documents

```
GET /api/documents
GET /api/documents?spaceId=default
GET /api/documents?templates=1
```

| Parameter | Description |
|-----------|-------------|
| `spaceId` | Filter documents by space ID |
| `templates` | Set to `1` to list template documents only |
| _(none)_ | Returns 50 most recently updated documents |

### Create a document

```
POST /api/documents
Content-Type: application/json

{
  "space_id": "default",
  "title": "My Document",
  "content": "# Hello\n\nThis is my document.",
  "tags": ["guide", "onboarding"],
  "template_id": "tpl-rfc"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `space_id` | Yes | The space to create the document in |
| `title` | Yes | Document title |
| `content` | No | Markdown content (ignored if `template_id` is set) |
| `tags` | No | Array of tag strings |
| `template_id` | No | Copy content from this template |
| `parent_id` | No | Parent document ID for nesting |

**Response:** `201 Created`

### Get a document

```
GET /api/documents/:id
```

Accepts either `id` or `slug`.

### Update a document

```
PUT /api/documents/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "# Updated\n\nNew content here.",
  "tags": ["updated"]
}
```

All fields are optional. Each update automatically creates a version snapshot of the previous state.

### Delete a document

```
DELETE /api/documents/:id
```

Deletes the document and all its version history.

## Sharing

### Create a share link

```
POST /api/documents/:id/share
```

**Response:**

```json
{
  "share_id": "abc123xyz..."
}
```

If the document already has a share link, the existing one is returned.

The public URL is: `http://localhost:3000/share/{share_id}`

### Revoke a share link

```
DELETE /api/documents/:id/share
```

### View a shared document (public)

```
GET /api/share/:shareId
```

Returns a subset of the document fields (no space_id or internal metadata). Returns `404` if the share link has been revoked.

## Version History

### List versions

```
GET /api/documents/:id/versions
```

Returns up to 50 most recent versions, sorted newest first.

**Response:**

```json
[
  {
    "id": 1,
    "document_id": "abc123",
    "title": "Previous Title",
    "content": "Previous content...",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

## Export

### Export a document

```
GET /api/documents/:id/export?format=md
GET /api/documents/:id/export?format=html
```

| Format | Content-Type | Description |
|--------|-------------|-------------|
| `md` | `text/markdown` | Raw markdown file |
| `html` | `text/html` | Standalone HTML with inline styles |

Both formats return the file as a download (Content-Disposition: attachment).

## Search

### Search documents

```
GET /api/search?q=deployment
```

Searches across document titles, content, and tags. Returns up to 20 results, with title matches ranked first.

**Response:**

```json
[
  {
    "id": "abc123",
    "title": "Deployment Guide",
    "slug": "deployment-guide",
    "space_id": "default",
    "snippet": "...run kubectl apply to deploy the..."
  }
]
```
