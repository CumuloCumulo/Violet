## ADDED Requirements

### Requirement: Vitest 配置支持 NestJS 装饰器
系统 SHALL 通过 `vite-plugin-swc-transform` 插件正确配置 SWC，使 Vitest 能解析 NestJS 装饰器（`@Injectable()`、`@Controller()`、`@Module()`、`@SubscribeMessage()` 等）。

#### Scenario: SWC 选项正确传递给插件
- **WHEN** vitest.config.ts 中调用 `swc()` 插件
- **THEN** SWC 选项 SHALL 包裹在 `swcOptions` 属性中，包含 `jsc.parser.syntax: 'typescript'`、`jsc.parser.decorators: true`、`jsc.transform.legacyDecorator: true`、`jsc.transform.decoratorMetadata: true`

#### Scenario: 装饰器类文件正常加载
- **WHEN** 测试文件 import 一个包含 `@Injectable()` 装饰器的服务类
- **THEN** SHALL 不抛出 "Expression expected" 或语法错误

### Requirement: 测试环境设置
系统 SHALL 在测试启动前加载 `reflect-metadata`，并配置 Node.js 测试环境。

#### Scenario: reflect-metadata 全局可用
- **WHEN** Vitest 启动并执行 `test/setup.ts`
- **THEN** `reflect-metadata` SHALL 已被导入，使 NestJS 的装饰器元数据正常工作

### Requirement: 清理 Jest 遗留依赖
系统 SHALL 从 package.json 的 dependencies/devDependencies 中移除 Jest 相关包。

#### Scenario: 移除 Jest 依赖
- **WHEN** 迁移完成
- **THEN** package.json 中 SHALL 不再包含 `jest`、`ts-jest`、`@types/jest` 依赖
