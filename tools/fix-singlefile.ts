import fs from 'fs-extra'

const content = fs.readFileSync('dist/index.html').toString()

fs.writeFile(
    'dist/index.html',
    content.replace(`type="module" crossorigin`, 'defer')
)
