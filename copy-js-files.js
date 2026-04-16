import fs from "fs";
import path from "path";

const srcDir = path.join(process.cwd(), "src");
const distDir = path.join(process.cwd(), "dist");

function copyFiles(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyFiles(srcPath, destPath);
    } else {
      if (item.endsWith(".js") || item.endsWith(".cjs")) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

copyFiles(srcDir, distDir);
console.log("Copied JS/CJS route files to dist/");
