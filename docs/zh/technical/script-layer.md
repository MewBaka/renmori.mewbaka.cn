---
title: 脚本层与引擎锁定
description: M2 阶段对 Ren'Py 脚本的加密变换、对注入式反编译器的阻断以及发行版锁定措施
---

# 脚本层与引擎锁定

M1 已将每个 `.rpyc` 加密存放在容器之内，因此现成工具无法在已发行的构建上接触到它们。M2 针对 Ren'Py 脚本*源码*提供**纵深防御**，用于应对容器内容被暴露的情形（容器密钥泄露或被推导出，或内存转储）；同时提供**引擎加固**，阻断注入式反编译器并锁定发行版构建。

## 1. 脚本变换（基线）

已编译的脚本以 pickle 形式将 AST 存放在 RPYC2 的 slot 载荷中（`zlib(pickle((data, stmts)))`）。在构建期，RenMori 将每个 pickle 载荷替换为：

```
SCRIPT_MAGIC (b"RMSC\x01") || nonce(12) || AES-256-GCM(script_key, pickle)
```

- **`script_key` 独立于容器主密钥**：仅凭主密钥暴露容器内容，*无法*得到可反编译的脚本，因为还需要脚本密钥；脚本密钥存放在运行时扩展中，在生产环境中则存放在闭源原生运行时中
- 变换可逆且无损：运行时会在 Ren'Py 反序列化 pickle 之前，将其解密为与原始内容完全一致的 pickle，因此 AST 语义不受任何影响；构建期实现见 [`script/transform.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/script/transform.py)，运行时实现为 [`runtime/hook.py`](https://github.com/MewBaka/RenMori/blob/main/src/renmori/runtime/hook.py) 中对 `renpy.script.loads` 的补丁

### 为何能使反编译器失效

存储的 slot 载荷不再是 pickle，反编译器提取到的只是 `SCRIPT_MAGIC || ciphertext`。已在同一个 `script.rpyc` 上针对以下两款工具验证：

| 工具 | 原始 `.rpyc` | 经 RenMori 变换后 |
|------|--------------|-------------------|
| `unrpyc` | 反编译为 `.rpy` | **失败** |
| `unrpyc --try-harder` | — | **失败**（其 zlib/base64/hex/转义解码层无法处理 AES-GCM） |
| `rpycdec` | 反编译为 `.rpy` | **失败**（`Unsupported file format`） |

### 闭源升级：逐构建的 AST 结构随机化

基线的还原只需一个带密钥的步骤：攻击者一旦获得某个构建的脚本密钥，就能拿回标准 pickle。闭源多态引擎更进一步：它逐构建随机化已编译脚本的*结构*，使载荷即使被完全解密，也不含反编译器可据以分派的标准类名，且不存在可以还原它的单一可逆密钥。这是一项绝不分发给玩家的构建期变换，且每次构建各不相同，因此一次破解无法迁移到其他构建。其机制与实现属于专有内容，位于私有仓库 `MewBaka/RenMori-core`。

## 2. 注入阻断（引擎层）

`un.rpyc` 式反编译器的工作方式是被放入 `game/` 并作为脚本加载，由其 init 代码导出全部内容。RenMori 拒绝**打开**任何实际路径位于游戏目录内的类脚本文件（`.rpyc/.rpymc/.rpy/.rpym/.rpe`），因此被注入文件的代码永远不会运行。`renpy/common` 下的引擎脚本不受影响（该防护仅作用于游戏目录）。合法的 Ren'Py 脚本只来自容器。验证结果：植入的 `game/*.rpyc` 在 `load_core` 中返回 `None`，而容器内的脚本仍可正常加载。

## 3. 发行版锁定

在受保护的构建中，运行时将 `config.developer` 与 `config.console` 设为 `False`，并拒绝执行导出数据的子命令（`compile`、`dialogue`、`translate`、`add_from`、`merge_strings`）。`renpy.sh … lint` 与 `run` 仍可正常使用。

## 验证

```bash
python tools/verify_in_renpy.py --sdk /Applications/renpy-8.5.2-sdk \
    --game /Applications/renpy-8.5.2-sdk/the_question
```

阶段 1（扩展加载）：资源逐字节一致；每个脚本载荷均已变换（不再是 pickle），且能还原为有效的 pickle；植入磁盘的脚本被拒绝。阶段 2（完整 `lint`）：引擎端到端加载并解析每一个经过变换的脚本，没有任何错误。此外，单元测试 [`tests/test_script.py`](https://github.com/MewBaka/RenMori/blob/main/tests/test_script.py) 覆盖了无损变换的往返验证。校验脚本见 [`tools/verify_in_renpy.py`](https://github.com/MewBaka/RenMori/blob/main/tools/verify_in_renpy.py)。
