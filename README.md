<div align="center">
    <h1>BookmarkFS - the dumbest project i've ever made</h1>
</div>
Exploits the google chrome bookmark sync service to store files for free

# Installation and usage
1. Go to releases and download bookmarkfs.crx
2. Go to chrome://extensions and enable developer mode
3. Drag and drop the .crx file into the extensions page


To upload a file, click on the icon for the extension and it will open up a page where you can upload, download, and delete files

# How does it work?
Every bookmark can contain a maximum of 9092 charaters before google refuses to sync them. Using base64 encoding, this means you can fit around 72kb into a single bookmark.
When you upload a file, it gets compressed using gzip, encoded into base64, split into multiple bookmarks, and stored into folders corresponding with the file name.

# Demo


https://user-images.githubusercontent.com/58010778/190885315-206a6bbf-eab1-4d0d-a7f6-bb4a15c30914.mp4




# Things you might be wondering

"Why?"
    "Science isn't about why, it's about why not" - Cave Johnson

"What's the max file size?"
    Not infinite, unfortunately. The syncing should be theoretically infinite, I've tested with over 10k bookmarks and file sizes > 100MB, but the bottleneck is your computer's memory. When you launch the extension, all of the files will eventually get loaded into RAM, slowing things down quite a bit and eventually crashing chrome with enough files. There might be ways to get around this.

"Why folders? there aren't any actual bookmarks"
    Using bookmarks works, and since the url section can be used as well, you can get over well double the storage density. However, chrome does not seem to sync bookmarks that long nested so deeply.
    Fortunately, it has no problems with me using folders and storing as much of them as I want 


# Building from source
1. clone the github repo
2. `npm run build`
3. go to chrome://extensions, hit load unpacked and select the folder

# Disclaimer
DO NOT hover over the bookmarks folder when large files are uploaded. It will freeze chrome, or if you're using a chromebook it crashes the entire chromebook. At one point it even made Xorg crash.


Partially inspired by spreadsheetfs