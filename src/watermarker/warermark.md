# Image watermarker CLI

A CLI tool that can be used to print text on top of the provided image i.e. watermark the image, the purpose is to deter people from sharing the image.
The font is size of the text is variable to guaranteed that all lines provided are fully visible on the image at least once.

## Commands

### watermark

Given a path to an image and 1-5 (Max could be increased after testing) lines of text it will produce a watermarked image.

shell
watermark --help
A tool that can be used to watermark images with the inputted text

USAGE:
    watermark [OPTIONS] --input <INPUT> --output <OUTPUT> --lines <LINES>...

OPTIONS:
    -h, --help                Print help information
    -i, --input <INPUT>       The file path to the image to watermark
    -l, --lines <LINES>...    Takes a list of text lines which will be printed on top of the image.
                              Min 1 & max 5 lines
    -o, --output <OUTPUT>     The file path where to save the watermarked image
    -p, --prefix <PREFIX>     A prefix to add to each line. Use if all lines should start with the
                              same text


### Build for Lambda

When building the Rust code we need to target an architecture compatible with Lambda. The typical approach is to build within a Docker container but that can be quite slow.
So instead we could use the built-in [rustup cross compilation](https://rust-lang.github.io/rustup/cross-compilation.html) feature.

The issue with this is that it requires extra config steps prior to build. Considering we need to run it in Github actions, and each developer that wants to deploy from his local machine needs to do the same step it might be worth building in a docker container anyway.

Steps to use current cross compilation on a Mac or Ubuntu (Homebrew is needed):

1. $ cargo install cargo-lambda
2. $ brew install zig

Then the update-layer.sh uses the targeted build so that it works in lambda:
$ cargo lambda build --release --target x86_64-unknown-linux-musl