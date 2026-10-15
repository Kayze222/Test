import * as T from './vendor/three.module.min.js';
import {models} from './assets/models/kenney-meshes.js';
const geometries=new Map();
const material=new T.MeshLambertMaterial({vertexColors:true,flatShading:true});
// Shared geometry and material keep each additional chest inexpensive.
export function sourcedModel(name){
 if(!geometries.has(name)){
  const data=models[name];if(!data)throw new Error('Unknown bundled model: '+name);
  const geometry=new T.BufferGeometry();
  for(const key of ['position','normal','color'])geometry.setAttribute(key,new T.Float32BufferAttribute(data[key],3));
  geometry.setIndex(data.index);geometry.computeBoundingBox();geometry.computeBoundingSphere();geometries.set(name,geometry);
 }
 const model=new T.Mesh(geometries.get(name),material);model.name=name;model.userData.source='Kenney Blaster Kit 2.1 / CC0';return model;
}
