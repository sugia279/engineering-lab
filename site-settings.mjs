// Keep project Pages working both before and after the repository rename.
export const repository = process.env.GITHUB_REPOSITORY || 'sugia279/hiens-nha';
export const base = `/${repository.split('/')[1]}/`;
