#!/bin/bash
echo "Start building using emcc ..."
START=$(date +%s)
emcc -O3 -g  \
  $EXTRA_BUILD_FLAGS \
  -I /kvazaar/src \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s EXPORT_NAME="kvazaarEncoder" \
  -o "/dist/$BUILD_NAME.out.js" \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS=_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=addFunction,removeFunction,ccall,GROWABLE_HEAP_U8 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s ALLOW_TABLE_GROWTH=1 \
  -s USE_PTHREADS=1 \
  -s SHARED_MEMORY=1 \
  -pthread \
  --cache "/cache" \
  /src/kvazaar_encoder.cc \
  /kvazaar/src/*.c /kvazaar/src/strategies/*.c /kvazaar/src/strategies/generic/*.c /kvazaar/src/strategies/avx2/*.c \
  /kvazaar/src/strategies/sse2/*.c /kvazaar/src/strategies/sse41/*.c /kvazaar/src/strategies/x86_asm/*.c \
  /kvazaar/src/strategies/altivec/*.c /kvazaar/src/extras/*.c
END=$(date +%s)
echo "Done building using emcc in $(($END - $START))s"