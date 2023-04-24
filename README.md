# kvazaar-wasm

This project showcases the usage of [kvazaar](https://github.com/ultravideo/kvazaar) with [WebAssembly](https://webassembly.org/) using [emscripten](https://emscripten.org/).

## How the demo works
The `docker-compose.yml` file will build the WebAssembly files and Javascript wrappers using emscripten into `dist/`.
`dist/` is then mounted into a NodeJS-Container and served using a plain `http.createServer`.



## Running the demo

Run the following instructions to deploy a local webserver serving the demo.

### Build and serve without sanitizing
```bash
git clone https://github.com/DoLevi/kvazaar-wasm
cd kvazaar-wasm

docker-compose up serve
```
### Build and serve with sanitizing
The demo can also be built and served with sanitizing compiled into the WebAssembly files.
Execute the following commands to run the demo:
```bash
git clone https://github.com/DoLevi/kvazaar-wasm
cd kvazaar-wasm

docker-compose up serve-with-sanitizing
```

You can change the port the webserver will listen on in `docker-compose.yml` for each respective service.

## Sources
| Topic of interest             | Location                           |
|-------------------------------|------------------------------------|
| C-Code                        | `src/kvazaar-encoder.cc`           |
| WebAssembly building          | `src/build_coder.sh`               |
| Demo file server              | `file-server/index.js`             |
| Demo Main Page                | `dist/index.html`                  |
| Demo WebAssembly-interactions | `dist/kvazaar-wasm-demo.worker.js` |

Changes to files in `dist/` are not hot-reloaded but refreshing the page (disregarding browser cache) will make them visible.

Changes to files in `src/` must be recompiled using `docker-compose up serve` or `docker-compose up serve-with-sanitizing`
