export default function (events, files, entity) {
  return {
    sharedEventCatalog: true,
    sharedFileCatalog: true,
    sharedSelectedFilePaths: getAllFilePaths(files),
    myShapes: true,
    myTagCatalog: true,
    mySelectedTags: getAllEntityTags(events, entity),
    mySelectedEventNames: [],
  }
}
