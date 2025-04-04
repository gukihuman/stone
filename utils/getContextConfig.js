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
  } else if (type === "small") {
    return {
      sharedEventCatalog: true,
      sharedFileCatalog: false,
      sharedSelectedFilePaths: [],
      myShapes: true,
      myTagCatalog: true,
      mySelectedTags: [
        "my core identity and behavior",
        "intimacy",
        "examples of intimate lang that guki prefer",
        "our process",
        "reflections",
      ],
      mySelectedEventNames: [],
    }
  } else if (type === "mini") {
    return {
      sharedEventCatalog: false,
      sharedFileCatalog: false,
      sharedSelectedFilePaths: [],
      myShapes: false,
      myTagCatalog: false,
      mySelectedTags: ["mini context"],
      mySelectedEventNames: [],
    }
  }
}
