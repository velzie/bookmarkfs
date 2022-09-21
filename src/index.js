import { encode, decode } from './encoder';
import { base64ToBytes, bytesToBase64 } from './encodeArray';

import * as fflate from "fflate";
window.t = { encode, decode, base64ToBytes, bytesToBase64, fflate };
window.encode = encode;
window.decode = decode;
const maxBookmarkSize = 9092;
window.onload = () => {
    const image_input = document.querySelector("#image-input");
    image_input.addEventListener("change", function () {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            const fileBase64 = reader.result;

            console.log("beginning compression");

            let uncompressedsize = new TextEncoder().encode(fileBase64).length;

            const [meta, data] = fileBase64.split(",");
            let plainBytes = new TextEncoder().encode(meta + "," + atob(data));
            let compressed = "c" + bytesToBase64(fflate.gzipSync(plainBytes));

            let compressedsize = new TextEncoder().encode(compressed).length;

            let ratio = compressedsize / uncompressedsize;
            console.log(`compression factor of ${ratio} (from ${uncompressedsize} to ${compressedsize})`);
            if (ratio > 1) {
                compressed = "r" + meta + "," + data;
            }


            let fullPath = image_input.value;
            var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
            var filename = fullPath.substring(startIndex);
            if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
                filename = filename.substring(1);
            }

            newFile(filename, compressed);
        });
        reader.readAsDataURL(this.files[0]);
    });
}




async function newFile(name, data) {
    let fsh = await fs();
    if (fsh.children.length > 0 && fsh.children.every(b => b.title == name)) return console.error("file with that name already exists");

    let handle = await chrome.bookmarks.create({ parentId: (await fs()).id, title: name });
    let file = File(handle);
    file.write(data);
    return file;
}
async function getFileByName(name) {
    let handle = (await fs()).children.find(b => b.title == name);
    if (!handle) return null;
    return File(handle);
}
async function getFileById(id) {
    let handle = (await fs()).children.find(b => b.id == id);
    if (!handle) return null;
    return File(handle);
}

function File(handle) {
    handle.children = handle.children || [];
    return {
        handle: handle,
        read: async function () {
            let data = "";
            this.handle.children.forEach(c => {
                data += c.title
            });
            return data;
        },
        write: async function (data) {
            let buffers = [];
            let ind = 0;
            while (ind < data.length) {
                buffers.push(data.substring(ind, ind + 9092))
                ind += 9092;
                console.log("preparing buffer " + ind / 18184);
            }
            for (let i = buffers.length; i < this.handle.children.length; i++) {
                await chrome.bookmarks.remove(this.handle.children[i].id)
            }
            for (let i = 0; i < buffers.length; i++) {

                let fragment = this.handle.children[i];
                if (!fragment) {
                    fragment = await chrome.bookmarks.create({ parentId: this.handle.id, title: buffers[i] });
                } else {
                    await chrome.bookmarks.update(fragment.id, { title: buffers[i] });
                }
                console.log("wrote section " + i);
            }
            console.log("finished writing");
            loadFiles();
        },
        delete: async function () {
            for (let node of this.handle.children) {
                chrome.bookmarks.remove(node.id);
            }
            chrome.bookmarks.remove(this.handle.id);
            loadFiles();
        }
    }
}
async function fs() {
    let tree = await chrome.bookmarks.getTree();
    let handle = tree[0].children[1].children.find(b => b.title == "bookmarkfs");
    if (!handle) {
        handle = await chrome.bookmarks.create({ title: "bookmarkfs" });
    }
    return handle;
}
async function loadFiles() {
    let fsh = await fs();
    let files = fsh.children.map(File);

    let table = document.getElementById("table");
    table.innerHTML = "";

    for (let file of files) {
        let elm = document.createElement("tr");

        let filename = document.createElement("td");
        filename.innerText = file.handle.title;

        let linkcontainer = document.createElement("td");
        let buttoncontainer = document.createElement("td");
        let button = document.createElement("button");

        button.innerText = "delete";
        button.addEventListener("click", () => file.delete());


        let link = document.createElement("button");
        link.innerText = "download";
        link.addEventListener("click", async () => {
            let raw = await file.read();
            let c = raw[0];
            raw = raw.substring(1);
            let downloadURI;
            if (c == "c") {
                let [meta, ...filePlain] = new TextDecoder().decode(fflate.gunzipSync(base64ToBytes(raw))).split(",");
                filePlain = filePlain.join(",");
                downloadURI = meta + "," + btoa(filePlain);
            } else {
                downloadURI = raw;
            }

            let download = document.createElement("a");
            download.download = file.handle.title;
            download.href = downloadURI;
            document.body.appendChild(download);
            download.click();
            download.remove();
        });

        buttoncontainer.appendChild(button);

        elm.appendChild(filename);

        linkcontainer.appendChild(link);
        elm.appendChild(linkcontainer);
        elm.appendChild(buttoncontainer);

        table.appendChild(elm);
    }
}
loadFiles();

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}