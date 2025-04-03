export default function (events, files, entity, type) {
  if (type === "full") {
    return {
      sharedEventCatalog: true,
      sharedFileCatalog: true,
      sharedSelectedFilePaths: getAllFilePaths(files),
      myShapes: true,
      myTagCatalog: true,
      mySelectedTags: getAllEntityTags(events, entity),
      mySelectedEventNames: [],
    }
  } else if (type === "mini") {
    return {
      sharedEventCatalog: true,
      sharedFileCatalog: true,
      sharedSelectedFilePaths: [
        "utils\\remember.js",
        "utils\\getContext.js",
        "utils\\getContextConfig.js",
        "utils\\getAllEntityEventNames.js",
        "utils\\getAllEntityTags.js",
        "utils\\getAllFilePaths.js",
        "README.md",
      ],
      myShapes: true,
      myTagCatalog: true,
      mySelectedTags: ["my core identity and behavior"],
      mySelectedEventNames: [],
    }
  }
}
