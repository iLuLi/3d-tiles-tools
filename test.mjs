import {ToolsMain} from './src/cli/ToolsMain.js';
import fs from 'fs';
import path from 'path'
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdef');


function withBOM(buff) {
    return buff[0].toString(16).toLowerCase() === "ef" && buff[1].toString(16).toLowerCase() === "bb" && buff[2].toString(16).toLowerCase() === "bf";
}

function removeJsonUTF8BOM(parentPath) {
    const items = fs.readdirSync(parentPath);
    items.forEach(item => {
        const itemPath = path.resolve(parentPath, item);
        const stat = fs.statSync(itemPath);
        if (!stat.isDirectory()) {
            const ext = path.extname(itemPath);
            if (ext === '.json') {
                let buffer = fs.readFileSync(itemPath);
                if (withBOM(buffer)) {
                    buffer = buffer.slice(3);
                    fs.writeFileSync(itemPath, buffer.toString(), "utf8");
                }
            }
        } else {
            removeJsonUTF8BOM(itemPath);
        }
    });
}

function getTilesetPath(parentPath) {
    const items = fs.readdirSync(parentPath);
    let result = [];
    // 检查是否有.json文件，如果有看是否是tileset.json，如果不是重命名
    const hasJson = items.some(item => {
        const itemPath = path.resolve(parentPath, item);
        const stat = fs.statSync(itemPath);
        if (!stat.isDirectory()) {
            const ext = path.extname(itemPath);
            if (ext === '.json') {
                const noTilesetJson = path.parse(itemPath).name.toLowerCase() !== 'tileset';
                if (noTilesetJson) {
                    // 重命名为tileset.json
                    // let buffer = fs.readFileSync(itemPath);
                    // buffer = iconv.decode(buffer, 'utf8');
                    // fs.writeFileSync(path.resolve(parentPath, 'tileset.json'), buffer);
                    fs.renameSync(itemPath, path.resolve(parentPath, 'tileset.json'));
                    // 删除原json
                    // if (noTilesetJson) fs.unlinkSync(itemPath);
                }
                return true;
            }
        }
        return false;
    });
    if (hasJson) {
        result.push(parentPath);
    } else {
        // 继续往下遍历
        items.forEach(item => {
            const itemPath = path.resolve(parentPath, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
              let children = getTilesetPath(itemPath)
              result = result.concat(children);
            }
        });
    }
    
    return result;
}

const pathMagic = 'hc';

function changeDirName(list, rootPath) {
    let parentList = [];
    // 更改文件夹名称
    list.forEach(srcPath => {
        const pathName = path.basename(srcPath);
        if (pathName.indexOf(pathMagic) === 0) return;
        const parentPath = path.dirname(srcPath);
        if (parentPath !== rootPath && parentList.indexOf(parentPath) === -1) {
            parentList.push(parentPath);
        }
        console.log(parentPath);
        fs.renameSync(srcPath, path.resolve(parentPath, pathMagic + nanoid(5)));
    });
    if (parentList.length > 0) {
        changeDirName(parentList, rootPath);
    }
}

const rootPath = path.normalize('D:\\tilesetTest\\实景第三段');
const targetRootPath = path.normalize('E:\\server\\HCity\\数据服务\\HCityData\\projs\\zqps0531\\mds');
const resultName = path.basename(rootPath);

let srcPath = rootPath;
let targetPath = path.resolve(targetRootPath, resultName);

// 移除json中的bom
removeJsonUTF8BOM(rootPath);

let list = getTilesetPath(rootPath)
console.log(list);
if (list.length > 1) {
    changeDirName(list, rootPath);
    list = getTilesetPath(rootPath)
    // 合并
    ToolsMain.merge(list, targetPath, true);
    srcPath = targetPath;
}
// 升级
ToolsMain.upgrade(srcPath, targetPath, true, '1.0');

// 合并外部json
// ToolsMain.combine(mergeTargetPath, path.resolve(targetRootPath, '合并外部json'), true);
