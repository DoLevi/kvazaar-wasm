FROM emscripten/emsdk:3.1.32

RUN apt update && apt install automake autoconf libtool m4 build-essential yasm -y
RUN git clone https://github.com/ultravideo/kvazaar.git /kvazaar

RUN cd /kvazaar && emconfigure ./autogen.sh
RUN cd /kvazaar && emconfigure ./configure --host=none
RUN cd /kvazaar && emmake make -j$(nproc)

WORKDIR /kvazaar