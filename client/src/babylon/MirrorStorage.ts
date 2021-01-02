/** Handle Mirror */
import * as BABYLON from 'babylonjs'

export default class MirrorStorage {
  mirrorMaterial: BABYLON.StandardMaterial
  mirrorTex: BABYLON.MirrorTexture
  renderTarget: BABYLON.AbstractMesh[] = []

  constructor(scene: BABYLON.Scene) {
    //Create the mirror material
    this.mirrorMaterial = new BABYLON.StandardMaterial("mirror", scene);
    this.mirrorTex = new BABYLON.MirrorTexture("mirror", 1024, scene, true);
    // TODO: mirrorTex.renderList = this.game.getPlayerMesh()
    this.mirrorMaterial.reflectionTexture = this.mirrorTex;
    
  }

  createMirrorMaterial(glass: BABYLON.Mesh) {
    glass.computeWorldMatrix(true);
    const glass_worldMatrix = glass.getWorldMatrix();
  
    //Obtain normals for plane and assign one of them as the normal
    const glass_vertexData = glass.getVerticesData("normal");
    if (!glass_vertexData) {
      throw new Error('Cannot get vertexdata from default plane?!')
    }
    let glassNormal = new BABYLON.Vector3(
      glass_vertexData[0], glass_vertexData[1], glass_vertexData[2]);	
    //Use worldMatrix to transform normal into its current value
    glassNormal = BABYLON.Vector3.TransformNormal(
      glassNormal, glass_worldMatrix)
      //Create reflecting surface for mirror surface
    const reflector = BABYLON.Plane.FromPositionAndNormal(
      glass.position, glassNormal.scale(-1));
    
    const mirrorMaterial = this.mirrorMaterial;
    this.mirrorTex.renderList = this.renderTarget;
    this.mirrorTex.mirrorPlane = reflector;
    glass.material = mirrorMaterial;
    return glass;
  }
}