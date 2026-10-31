---
title: "容器格式 v1 规范"
description: RenMori 基线容器格式 v1 的公开规范，包括文件布局、头部与索引结构、分块加密、HKDF 密钥派生、nonce 与 AAD 方案
---

# 容器格式 v1

本页描述**基线**容器格式：固定、公开，强度适中。正式的发行版构建会经过闭源多态引擎处理，由其逐构建随机化布局与密钥派生；本规范描述的是开放框架所实现并测试的固定基线。

所有整数均为小端序。所有加密均采用 **AES-256-GCM**（16 字节认证标签）。

## 布局

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

### 头部（64 字节）

| 偏移 | 大小 | 字段 | 说明 |
|-----:|-----:|------|------|
| 0 | 8 | magic | `52 45 4E 4D 4F 52 49 01`（`RENMORI\x01`） |
| 8 | 2 | version | `1` |
| 10 | 2 | flags | 保留，`0` |
| 12 | 4 | chunk_size | 每个分块的明文字节数（默认 65536） |
| 16 | 8 | index_offset | 加密索引的字节偏移 |
| 24 | 8 | index_length | 加密索引长度（明文长度 + 16 字节认证标签） |
| 32 | 12 | index_nonce | 索引的 GCM nonce |
| 44 | 16 | container_id | 每个容器随机生成，作为全部密钥派生的盐 |
| 60 | 4 | reserved | `0` |

头部的前 **60 字节**（`reserved` 以外的全部字段）作为索引的 GCM AAD，因此头部一经改动，索引便无法解密。

### 索引

索引是一个经 GCM 加密的 UTF-8 JSON 对象：

```json
{ "v": 1, "files": { "<name>": [data_offset, size, "<file_id hex>"], … } }
```

- `name`：相对于 Ren'Py 游戏目录的路径，使用正斜杠，不带前导斜杠（如 `images/bg.png`）
- `data_offset`：该文件第一个加密分块的绝对偏移
- `size`：明文大小（字节）
- `file_id`：16 字节随机值（十六进制表示），每个文件唯一，作为文件密钥的盐

### 文件载荷

每个文件的明文按 `chunk_size` 字节切分为若干分块（空文件视为一个空分块，因此仍带有认证标签）。每个分块独立加密，以 `ciphertext || tag` 的形式存储（长度为明文长度 + 16）。由于每个非末尾分块的明文恰为 `chunk_size` 字节，文件的第 *i* 个分块总是起始于 `data_offset + i*(chunk_size + 16)`，因此无需扫描即可**通过 seek 随机访问**。

## 密钥派生（HKDF-SHA256，RFC 5869）

```
index_key      = HKDF(ikm=master_key, salt=container_id, info="renmori/v1/index")
file_key(id)   = HKDF(ikm=master_key, salt=container_id, info="renmori/v1/file/" + id)
```

- `master_key` 为 32 字节，其在运行时的来源**不属于**本基线规范：开放框架将其作为输入接收，而在已发行的游戏中，由闭源的密钥派生逻辑负责隐藏并重建它
- 每个文件使用独立密钥，使 nonce 方案的作用范围限定在单个密钥之内

### 每个分块的 nonce（12 字节）与 AAD

```
nonce(i) = file_id[:8] || uint32_le(i)
aad(i)   = uint32_le(i) || uint8(1 if last chunk else 0)
```

计数器保证每个 nonce 在单个文件内唯一，每个文件唯一的密钥则保证其在不同文件之间唯一。AAD 将每个分块与其位置绑定并标记末尾分块，因此分块无法被重新排序，文件也无法在不被察觉的情况下被截断。

## 安全说明（基线）

- 由 GCM 提供分块级别的机密性与完整性：任何位置的篡改都会导致解密失败
- 该格式**公开且固定**，因此单独使用时仅具备基线强度：只有在攻击者同时掌握主密钥时，通用读取器才有可能实现；真正的屏障是运行时密钥派生（闭源）与逐构建多态（闭源），二者均不在本规范范围内
- 设计上不在本规范处理范围内的威胁：内存提取与屏幕截取，见 [威胁模型](./threat-model.md)

## 参考实现

- 写入器：[`src/renmori/container/writer.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/writer.py)
- 读取器与流式读取：[`src/renmori/container/reader.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/reader.py)
- AES-GCM 后端：[`src/renmori/container/crypto.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/crypto.py)
- 格式常量与密钥派生：[`src/renmori/container/format.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/container/format.py)
