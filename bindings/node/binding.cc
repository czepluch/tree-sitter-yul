#include <napi.h>

typedef struct TSLanguage TSLanguage;

extern "C" TSLanguage *tree_sitter_yul();

static napi_value Init(napi_env env, napi_value exports) {
  napi_value language;
  napi_create_external(env, tree_sitter_yul(), NULL, NULL, &language);
  napi_set_named_property(env, exports, "language", language);
  return exports;
}

NAPI_MODULE(tree_sitter_yul_binding, Init)
