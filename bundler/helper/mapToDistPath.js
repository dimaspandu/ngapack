import path from "path";

/**
 * Build destination path string while preserving relative structure.
 *
 * @param {string} sourcePath - Absolute source file path
 * @param {string} distPath - Absolute dist folder path
 * @returns {{
 *   success: boolean,
 *   source: string,
 *   destination?: string,
 *   error?: string
 * }}
 */
export default function mapToDistPath(sourcePath, distPath) {
  try {
    const sourceAbs = path.resolve(sourcePath);
    const distAbs = path.resolve(distPath);

    // project root = parent folder of dist
    const projectRoot = path.dirname(distAbs);

    // relative path from project root
    const relative = path.relative(projectRoot, sourceAbs);

    // remove leading "dist/" if exists
    const cleanRelative = relative.replace(/^dist[\\/]/, "");

    const destination = path.join(distAbs, cleanRelative);

    return {
      success: true,
      source: sourceAbs,
      destination,
    };
  } catch (err) {
    return {
      success: false,
      source: sourcePath,
      error: err.message,
    };
  }
}
