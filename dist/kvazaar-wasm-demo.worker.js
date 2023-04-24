import kvazaarEncoder from "./kvazaar-encoder.out.js";

let encoder;
let writeStream;
let inputWriter;

const prepareUTF8 = (chunk) => new Promise((res, rej) => {
    const buffSegment = new Uint8Array(chunk.allocationSize());
    chunk.copyTo(buffSegment).then((layout) => {
        const data = {
            data: buffSegment,
            width: chunk.codedWidth,
            height: chunk.codedHeight,
            layout, format: chunk.format
        };
        chunk.close();
        res(data);
    }).catch(rej);
});
const createVideoFrame2UInt8ArrayTransformer = () => {
    const outStream = new TransformStream();
    const writer = outStream.writable.getWriter();
    const inStream = new WritableStream({
        write: (chunk) => {
            prepareUTF8(chunk).then(writer.write.bind(writer));
        }
    });

    return {writable: inStream, readable: outStream.readable};
};

self.addEventListener("message", async (evt) => {
    switch (evt.data.cmd) {
        case "createEncoder":
            const onFrameEncoded = encoder.addFunction((pts, sliceType, nalUnitType, data, length) => console.log(
                `PTS: ${pts}\nSliceType: ${sliceType}\nEncoded data length: ${length}\nEncoded data:`, Uint8Array.from(encoder.GROWABLE_HEAP_U8().subarray(data, data + length))
            ), "viiiii");
            encoder.ccall("create_encoder", null,
                ["string", "string", "string", "string", "string", "string", "number", "number"],
                ["ultrafast", evt.data.width.toString(), evt.data.height.toString(), evt.data.threads.toString(), evt.data.gop, evt.data.owf, evt.data.loopInterval, onFrameEncoded]
            );
            const writeStream = new WritableStream({
                write: (chunk) => {
                    prepareUTF8(chunk).then((frame) => {
                        const buffSegmentP = encoder._malloc(frame.data.length);
                        encoder.GROWABLE_HEAP_U8().set(frame.data, buffSegmentP);
                        encoder._encode_frame(frame.width, frame.height, frame.timestamp, buffSegmentP,
                            frame.layout[0].offset, frame.layout[0].stride,
                            frame.layout[1].offset, frame.layout[1].stride,
                            frame.layout[2].offset, frame.layout[2].stride);
                    });
                }
            });
            inputWriter = writeStream.getWriter();
            break;
        case "encode":
            const frame = evt.data.frame;
            if (frame.format !== "I420") {
                alert(`VideoFrame format ${frame.format} not wired to kvazaar. Aborting...`);
                encoder._close_encoder();
                inputWriter.close();
            }
            inputWriter.write(frame);
            break;
        case "closeEncoder":
            encoder._close_encoder();
            inputWriter.close();
            break;
    }
});

kvazaarEncoder().then((kvazaarEncoderInstance) => {
    encoder = kvazaarEncoderInstance;
    self.postMessage({status: "initDone"});
});
