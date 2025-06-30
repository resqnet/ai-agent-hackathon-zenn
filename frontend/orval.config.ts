import { defineConfig } from 'orval';

export default defineConfig({
  'kids-food-advisor': {
    input: {
      // agent_engine_streamのOpenAPI仕様を使用
      target: '../cloud_functions/agent_engine_stream/openapi.yaml',
      // 将来的にはagent_engine_streamからHTTP経由で取得可能になったら以下に変更
      // target: 'http://localhost:8082/api/openapi.yaml',
    },
    output: {
      target: './src/generated/api.ts',
      prettier: true,
      clean: true,
      client: 'react-query',
      override: {
        mutator: {
          path: './src/utils/api-mutator.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
        // operations設定は現在のOrvalバージョンでは不要
        // カスタムフック名は自動生成される
      },
    },
    hooks: {
      afterAllFilesWrite: [
        'prettier --write ./src/generated/api.ts',
      ],
    },
  },
});