import { createFileSystemObserver, DirectoryHandle, directoryPicker, FileSystemObserverInstance } from "../platform/browser/directory-picker.js";
import { panzoom, PanZoomInstance } from "../platform/panzoom/index.js";
import { useViewModel, makeObservable, ChangeType, classNames } from "../platform/preact/index.js";
import "./index.scss";
import { Fragment, h } from "preact";

export class AppViewModel {
  handle: DirectoryHandle | undefined
  files: [string, string, FileSystemFileHandle][]
  observer: FileSystemObserverInstance | undefined
  selected: undefined | number
  ref: HTMLElement | undefined
  panzoomRef: PanZoomInstance | undefined
  navHidden: boolean
  toRemove: string | undefined

  constructor() {
    this.handle = undefined
    this.files = []
    this.selected = undefined
    this.ref = undefined
    this.panzoomRef = undefined
    this.navHidden = false
    this.toRemove = undefined
    
    makeObservable(this, {
      files: ChangeType.Push,
      selected: ChangeType.Push,
      navHidden: ChangeType.Push,
      toRemove: ChangeType.Push,
    })
  }

  onInit() {
    globalThis.addEventListener('keydown', event => {
      if (this.selected === undefined) return
      if (event.key === "ArrowRight" && this.selected === this.files.length - 1) {
        // this.selectImage(0)
      } else if (event.key === "ArrowRight") {
        this.selectImage(this.selected + 1)
      } else if (event.key === "ArrowLeft" && this.selected === 0) {
        // this.selectImage(this.files.length - 1)
      } else if (event.key === "ArrowLeft") {
        this.selectImage(this.selected - 1)
      }
    })
  }

  async pickDirectory() {
    if (this.observer) this.observer.disconnect()
    this.handle = await directoryPicker()
    await this.readDirectory()
    this.selected = 0
    this.observer = await createFileSystemObserver(() => {
      this.readDirectory()
    })
    this.observer.observe(this.handle)
  }

  async readDirectory() {
    if (!this.handle) return

    const handles: [File, FileSystemFileHandle][] = []

   for await (const [name, handle] of this.handle.entries()) {
      if (!(handle instanceof FileSystemFileHandle)) continue
      const file = await handle.getFile()
      if (!file.type.startsWith('image/')) continue
      handles.push([file, handle])
    }

    handles.sort((a, b) => a[0].lastModified - b[0].lastModified)

    for (const [,url] of this.files) {
      URL.revokeObjectURL(url)
    }

    const files: [string, string, FileSystemFileHandle][] = []

    for (const [file, handle] of handles) {
      const url = URL.createObjectURL(file)
      files.push([handle.name, url, handle])
    }

    this.files = files
  }

  getSelectedImage(): string | undefined {
    if (this.selected === undefined) return
    return this.files[this.selected][1]
  }

  selectImage(index: number) {
    this.selected = index
    const elm = document.querySelector(`[data-i="${index}"]`)
    if (!elm) return
    const parent = elm.parentElement
    if (!parent) return
    const elmWidth = elm.getBoundingClientRect().width
    const parentWidth = parent.getBoundingClientRect().width
    // @ts-expect-error
    const elmOffsetLeft = elm.offsetLeft
    parent.scroll({
      left: elmOffsetLeft - ((parentWidth / 2) - elmWidth / 2),
      behavior: 'smooth'
    })
  }

  onRef(element: HTMLElement | undefined) {
    if (!element) return
    if (this.panzoomRef) {
      this.panzoomRef.dispose()
    }
    this.ref = element
    this.panzoomRef = panzoom(this.ref)
  }

  resetPanzoom() {
    if (this.panzoomRef) {
      this.panzoomRef.dispose()
    }
  }

  toggleNav() {
    this.navHidden = !this.navHidden
  }

  async removeEntry(name: string) {
    if (this.toRemove === name) {
      await this.handle?.removeEntry(name)
    } else if (this.toRemove !== name) {
      this.toRemove = name
    }
  }
}

export function App({}) {
  const vm = useViewModel(() => new AppViewModel())
  const selected = vm.getSelectedImage()

  return (
    <Fragment>
      <main>
        {selected === undefined
          ? <button onClick={() => vm.pickDirectory()}>Pick Directory</button> 
          : <img ref={(r: any) => vm.onRef(r)} src={selected} />}
      </main>

      <div 
        className={classNames("toggle-nav", { "hidden": vm.navHidden })}
        onClick={() => vm.toggleNav()}>
        { vm.navHidden ? 'show' : 'hide'}
      </div>

      <nav className={classNames({ "hidden": vm.navHidden })}>
        {vm.files.map(([name, file], i)=> (
          <div 
            className={classNames('container', { "active": vm.selected === i })}
            data-i={i}>
            <button 
              className={classNames('delete', { "to-remove": vm.toRemove === name })}
              onClick={() => vm.removeEntry(name)}>X</button>
            <img
              loading="lazy"
              onClick={() => vm.selectImage(i)}
              key={name} 
              src={file} />
          </div>
        ))}
      </nav>
    </Fragment>
  );
}
