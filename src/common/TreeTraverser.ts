import { PathDoc } from '../models/PathModel';
import { NotFoundError } from './Errors';

export async function traversePathTree(root: PathDoc, path: string): Promise<PathDoc> {
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
