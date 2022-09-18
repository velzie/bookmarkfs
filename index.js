
window.onload = () => {
    const image_input = document.querySelector("#image-input");
    image_input.addEventListener("change", function () {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            const uploaded_image = reader.result;
            let fullPath = image_input.value;
            var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
            var filename = fullPath.substring(startIndex);
            if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
                filename = filename.substring(1);
            }
            newFile(filename, uploaded_image);
        });
        reader.readAsDataURL(this.files[0]);
    });
}


function diff(inp, interval) {
    let step = 0;
    while (step < inp.length) {
        if (read.substring(step, step + interval) != fillertext.substring(step, step + interval)) return step;
        step += interval;
    }
    return "?";
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
            return data.replaceAll("about:", "");
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

        let link = document.createElement("a");
        link.download = file.handle.title;
        link.href = await file.read();
        link.innerHTML = "download";

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