import fs from 'fs-extra'
import { zip } from 'zip-a-folder'
import path from 'path'

async function main() {
    const content = fs.readFileSync(path.join('dist', 'index.html')).toString()

    fs.writeFileSync(
        path.join('dist', 'index.html'),
        content.replace(`type="module" crossorigin`, 'defer')
    )

    await zip('dist', path.join('html.zip'))
}

main()
