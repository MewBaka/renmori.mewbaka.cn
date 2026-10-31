---
title: "Container Format v1 Specification"
description: The open specification of the RenMori baseline container format v1, covering file layout, header and index structure, chunked encryption, HKDF key derivation, and the nonce and AAD scheme
---

# Container format v1

This page describes the **baseline** container format: fixed and public, at moderate strength. Production distribution builds run it through the closed polymorphism engine, which randomizes the layout and key derivation per build; this specification describes the fixed baseline that the open framework implements and tests.

All integers are little-endian. All encryption is **AES-256-GCM** (16-byte authentication tag).

## Layout

```
+-------------------------------+  offset 0
| Header (64 bytes)             |
+-------------------------------+  offset 64
| Encrypted file payloads       |   (one region per file, in add order)
|   file A: chunk 0, chunk 1, …  |
|   file B: chunk 0, …           |
+-------------------------------+  header.index_offset
| Encrypted index (GCM)         |
+-------------------------------+  EOF
```

### Header (64 bytes)

| Offset | Size | Field | Notes |
|-------:|-----:|-------|-------|
| 0 | 8 | magic | `52 45 4E 4D 4F 52 49 01` (`RENMORI\x01`) |
| 8 | 2 | version | `1` |
| 10 | 2 | flags | Reserved, `0` |
| 12 | 4 | chunk_size | Plaintext bytes per chunk (default 65536) |
| 16 | 8 | index_offset | Byte offset of the encrypted index |
| 24 | 8 | index_length | Encrypted index length (plaintext length + 16-byte tag) |
| 32 | 12 | index_nonce | GCM nonce for the index |
| 44 | 16 | container_id | Random per container; salts all key derivation |
| 60 | 4 | reserved | `0` |

The first **60 bytes** of the header (every field except `reserved`) are the GCM AAD of the index, so the header cannot be altered without breaking index decryption.

### Index

The index is a GCM-encrypted UTF-8 JSON object:

```json
{ "v": 1, "files": { "<name>": [data_offset, size, "<file_id hex>"], … } }
```

- `name`: path relative to the Ren'Py game directory, with forward slashes and no leading slash (for example `images/bg.png`)
- `data_offset`: absolute offset of the file's first encrypted chunk
- `size`: plaintext size in bytes
- `file_id`: 16 random bytes (hex), unique per file, salting the file key

### File payload

Each file's plaintext is split into chunks of `chunk_size` bytes (an empty file is one empty chunk, so it still carries a tag). Each chunk is encrypted independently and stored as `ciphertext || tag` (plaintext length + 16). Because every non-final chunk holds exactly `chunk_size` bytes of plaintext, chunk *i* of a file always starts at `data_offset + i*(chunk_size + 16)`, which enables **random access by seek** without scanning.

## Key derivation (HKDF-SHA256, RFC 5869)

```
index_key      = HKDF(ikm=master_key, salt=container_id, info="renmori/v1/index")
file_key(id)   = HKDF(ikm=master_key, salt=container_id, info="renmori/v1/file/" + id)
```

- `master_key` is 32 bytes, and where it comes from at runtime is **not** part of this baseline specification: the open framework takes it as input, while in a shipped game the closed key-derivation logic hides and reconstructs it
- Per-file keys scope the nonce scheme to one key per file

### Nonce (12 bytes) and AAD per chunk

```
nonce(i) = file_id[:8] || uint32_le(i)
aad(i)   = uint32_le(i) || uint8(1 if last chunk else 0)
```

The counter makes each nonce unique within a file, and the unique per-file key makes it unique across files. The AAD binds each chunk to its position and flags the final chunk, so chunks cannot be reordered and a file cannot be silently truncated.

## Security notes (baseline)

- Confidentiality and integrity per chunk via GCM: tampering anywhere causes decryption to fail
- The format is **public and fixed**, so on its own it offers baseline strength: a universal reader is possible *only if* the attacker also holds the master key; the real barriers are runtime key derivation (closed) and per-build polymorphism (closed), neither of which is covered by this specification
- Out of scope by design: memory ripping and screen capture (see [Threat model](./threat-model.md))

## Reference implementation

- Writer: [`src/renmori/container/writer.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/writer.py)
- Reader and streaming: [`src/renmori/container/reader.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/reader.py)
- AES-GCM backends: [`src/renmori/container/crypto.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/crypto.py)
- Format constants and key derivation: [`src/renmori/container/format.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/format.py)
