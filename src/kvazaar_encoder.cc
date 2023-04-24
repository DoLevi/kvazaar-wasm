#include <stdint.h>
#include <string.h>
#include <time.h>
#include <stdlib.h>

#include "emscripten.h"
#include "kvazaar.h"

#ifdef __cplusplus
extern "C" {
#endif

const kvz_api *api;
kvz_config *config;
kvz_encoder *encoder;
struct timespec loop_interval;
void (*on_chunk_encoded)(int, int, int, const uint8_t*, int);

EMSCRIPTEN_KEEPALIVE
void create_encoder(const char* preset, const char* width, const char* height, const char* threads,
                    const char* gop, const char* owf, long loop_interval_ms,
                    void (*on_chunk_encoded_func)(int, int, int, const uint8_t*, int)) {
    on_chunk_encoded = on_chunk_encoded_func;

    api = kvz_api_get(8);
    config = api->config_alloc();
    api->config_init(config);
    api->config_parse(config, "preset", preset);
    api->config_parse(config, "width", width);
    api->config_parse(config, "height", height);
    api->config_parse(config, "threads", threads);
    api->config_parse(config, "gop", gop);
    api->config_parse(config, "owf", owf);
    encoder = api->encoder_open(config);
    loop_interval = { 0, loop_interval_ms * 1000000 };
}

EMSCRIPTEN_KEEPALIVE
void encode_frame(const uint32_t width, const uint32_t height, const uint32_t pts, const uint8_t *source_frame,
                  const uint32_t y_offset, const uint32_t y_stride,
                  const uint32_t u_offset, const uint32_t u_stride,
                  const uint32_t v_offset, const uint32_t v_stride) {
    kvz_picture* raw_frame = api->picture_alloc(width, height);

    const uint8_t *source_y = source_frame + y_offset;
    for (uint32_t row = 0; row < height; row++) {
        memcpy(raw_frame->y + row * raw_frame->stride, source_y + 0 * y_stride, width);
    }
    const uint8_t *source_u = source_frame + u_offset;
    const uint8_t *source_v = source_frame + v_offset;
    for (uint32_t row = 0; row < height / 2; row++) {
        memcpy(raw_frame->u + row * raw_frame->stride / 2, source_u + row * u_stride, width / 2);
        memcpy(raw_frame->v + row * raw_frame->stride / 2, source_v + row * v_stride, width / 2);
    }

    kvz_frame_info frame_info;
    kvz_data_chunk *data_out = NULL;
    uint32_t len_out = 0;

    // Feed a frame
    api->encoder_encode(encoder, raw_frame,
      &data_out, &len_out,
      0, NULL,
      &frame_info);

    // Wait until output is ready
    while (data_out == NULL || len_out == 0) {
      nanosleep(&loop_interval, NULL);
      api->encoder_encode(encoder, 0, &data_out, &len_out, 0, NULL,  &frame_info);
    }

    // Combine the chunks to make a full frame data
    uint8_t* output_data = (uint8_t*)malloc(len_out);
    uint8_t* ptr = output_data;
    kvz_data_chunk *previous_chunk = 0;
    for (kvz_data_chunk *chunk = data_out; chunk != NULL; chunk = chunk->next)
    {
      memcpy(ptr, chunk->data, chunk->len);
      ptr += chunk->len;
      previous_chunk = chunk;
    }
    api->chunk_free(data_out);
    on_chunk_encoded(pts, frame_info.slice_type, frame_info.nal_unit_type, output_data, len_out);
    free(output_data);
    api->picture_free(raw_frame);
}

EMSCRIPTEN_KEEPALIVE
void close_encoder() {
    api->config_destroy(config);
    api->encoder_close(encoder);
}

#ifdef __cplusplus
}
#endif