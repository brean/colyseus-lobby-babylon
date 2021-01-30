import * as BABYLON from 'babylonjs'
import { Observable } from 'babylonjs'

class Asset {
  meshName: string
  rootUrl: string
  fileName: string
  meshGroup: string
  loaded: boolean = false
  hidden: boolean

  constructor(meshName: string, meshGroup: string, rootUrl: string, fileName: string, hidden: boolean = false) {
    this.meshName = meshName;
    this.meshGroup = meshGroup
    this.rootUrl = rootUrl;
    this.fileName = fileName
    this.hidden = hidden;
  }

  public fullName():string {
    return `${this.meshName}_${this.rootUrl}${this.fileName}`
  }
}

class AssetLoader {
  assetsLoaded: Observable<null> = new Observable<null>()
  assets: Map<string, BABYLON.AbstractMesh[]> = new Map<string, BABYLON.AbstractMesh[]>();
  assetsToLoad: Asset[] = []
  numAssets: number = 0
  loadedAssets: number = 0

  private scene?: BABYLON.Scene
  private engine: BABYLON.Engine
  private loadingShown: boolean = false;

  constructor(engine: BABYLON.Engine, scene?: BABYLON.Scene) {
    this.scene = scene;
    this.engine = engine;
  }

  getCopy(name: string): BABYLON.AbstractMesh[] | undefined {
    const originalMeshes = this.assets.get(name)
    if (!originalMeshes) {
      return
    }
    const meshes: BABYLON.AbstractMesh[] = []
    for (const orig of originalMeshes) {
      const copy = orig.clone('', orig.parent)
      if (copy) {
        copy.visibility = 1.0;
        if (copy.material) {
          copy.material = copy.material.clone(copy.material.name)
        }
        meshes.push(copy)
      }
    }
    return meshes;
  }

  private onProgress(evt: BABYLON.ISceneLoaderProgressEvent) {
    let loadedPercent = "0";
    if (evt.lengthComputable) {
      loadedPercent = (evt.loaded * 100 / evt.total).toFixed();
    } else {
      var dlCount = evt.loaded / (1024 * 1024);
      loadedPercent = (Math.floor(dlCount * 100.0) / 100.0).toFixed();
    }
    const current = this.loadedAssets
    this.engine.loadingScreen.loadingUIText = `loading ${current+1}/${this.numAssets}: ${loadedPercent} %`;
  }

  private onLoaded(meshes: BABYLON.AbstractMesh[], asset:Asset) {
    // TODO: what about parallel loading?
    this.loadedAssets++;
    console.log(`LOAD: ${asset.rootUrl}${asset.fileName} into ${asset.meshGroup}`)
    asset.loaded = true;
    const existingMeshes = this.assets.get(asset.meshGroup)
    if (existingMeshes) {
      this.assets.set(asset.meshGroup, existingMeshes.concat(meshes))
    } else {
      this.assets.set(asset.meshGroup, meshes)
    }
    this.engine.loadingScreen.loadingUIText = `loading ${this.loadedAssets}/${this.numAssets}: 100 %`;
    if (this.loadedAssets >= this.numAssets) {
      this.assetsToLoad = []
      this.hideLoading()
      this.assetsLoaded.notifyObservers(null)
    }
  }

  private hideLoading() {
    this.loadedAssets = 0;
    if (this.loadingShown) {
      this.loadingShown = false;
      this.engine.loadingScreen.hideLoadingUI();
    }
  }

  public showLoading() {
    if (!this.loadingShown) {
      this.loadingShown = true;
      this.engine.loadingScreen.displayLoadingUI();
    }
  }

  uniqueAsset(assets:Asset[]):Asset[] {
    return assets.filter((asset, index) => {
      const a = assets.find((x) => {
        return x.fullName() === asset.fullName()
      })
      return a ? assets.indexOf(a) === index : false;
    });
  }

  preloadAssets() {
    // preload assets (synchronously)
    this.assetsToLoad = this.uniqueAsset(this.assetsToLoad);
    this.numAssets = this.assetsToLoad.length;
    this.showLoading();
    this.assetsToLoad.forEach((asset) => {
      BABYLON.SceneLoader.ImportMesh(
        asset.meshName, asset.rootUrl, asset.fileName,
        this.scene, 
        (meshes) => {
          if (asset.hidden) {
            meshes.forEach((mesh) => {
              mesh.visibility = 0;
            })
          }
          this.onLoaded(meshes, asset)
        },
        (evt) => this.onProgress(evt)
      );
    });
  }
}

export { Asset, AssetLoader };