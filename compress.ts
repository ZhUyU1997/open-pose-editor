import avsc from 'avsc'
import fs from 'fs-extra'

const data = fs.readJSONSync('src/poses/data.json')
const data0: [number, number, number][][] = data
    .map((i) =>
        i.map((value) => {
            if (value) {
                return [
                    Math.round(value[0] * 1000),
                    Math.round(value[1] * 1000),
                    Math.round(value[2] * 1000),
                ]
            } else return [0, 0, 0]
        })
    )
    .filter((i) => {
        const [a, b, c] = i[1]
        return b > 30 * 1000
    })

const int32Buffer = new Int32Array(data0.flat(2))
fs.writeFileSync('src/poses/data.bin', Buffer.from(int32Buffer.buffer))
console.log(data0.length, int32Buffer.byteLength)
