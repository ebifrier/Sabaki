const fs = require('fs')
const archiver = require('archiver')
const {basename} = require('path')
const {version} = require('../package.json')

let from = process.argv[2].replace(/x\.x\.x/g, version)
let to = `${from}.zip`

let archive = archiver.create('zip', {})
let output = fs.createWriteStream(to)
archive.pipe(output)

archive.directory(from, basename(from))

archive.finalize()
output.on('close', () => {
  let archiveSizeMB = Math.ceil(archive.pointer() / 1024 / 1024)
  console.log(`zip complete! total size: ${archiveSizeMB}MB`)
})
