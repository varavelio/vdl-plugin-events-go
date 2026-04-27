import { definePlugin } from "@varavel/vdl-plugin-sdk";

export const generate = definePlugin((input) => {
  // Your plugin logic goes here
  // Feel free to explore the plugin input
  console.log(input.version); // The VDL version without v prefix
  console.log(input.options); // Any option that the user passed to the plugin via vdl.config.vdl
  console.log(input.ir); // VDL intermediate representation from where your plugin generates code

  return {
    files: [
      {
        path: "hello.txt",
        content: "Hello from VDL Plugin",
      },
    ],
  };
});
