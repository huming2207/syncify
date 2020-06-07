import { DirDoc } from '../models/DirModel';
import { NotFoundError } from './Errors';
import { FileDoc } from '../models/FileModel';

export async function traversePathTree(root: DirDoc, path: string): Promise<DirDoc> {
    if (path === '/') return root;
    const pathArr = path.split('/').splice(1);
    let currPath = root;
    for (const pathItem of pathArr) {
        await currPath.populate('childrenPath').execPopulate();
        const childPath = currPath.childrenPath.filter((element) => element.name === pathItem);

        if (childPath.length < 1) {
            throw new NotFoundError('Directory does not exist');
        } else {
            currPath = childPath[0];
        }
    }
    return currPath;
}

export async function getFileFromDirectory(dir: DirDoc, fileName: string): Promise<FileDoc> {
    // Load files from the directory it should be in
    await dir.populate('files').execPopulate();

    // Load file
    const files = dir.files.filter((element) => element.name === fileName);
    if (files.length < 1) {
        throw new NotFoundError('File does not exist');
    }

    return files[0];
}
