import fs from 'fs-extra'
import path from 'path'

const resource = {
    de: {
        Generate: 'Generieren',
    },
    en: {
        Generate: 'Generate',
    },
    ja: {
        Generate: '生成する',
    },
    sp: {
        Generate: 'Generar',
    },
    'zh-CN': {
        Generate: '生成',
    },
    'zh-HK': {
        Generate: '生成',
    },
    'zh-TW': {
        Generate: '生成',
    },
}

async function main() {
    Object.entries(resource).forEach(([lng, content]) => {
        const file = path.join('src/locales', `${lng}.json`)
        const old = fs.readJSONSync(file)
        const output = {
            ...old,
            ...content,
        }
        fs.writeJSONSync(file, output, {
            spaces: 4,
        })
    })
}

main()
