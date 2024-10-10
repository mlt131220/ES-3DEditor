/**
 * @author MaHaiBing
 * @email  mlt131220@163.com
 * @date   2024/8/3 22:49
 * @description 包 骨骼处理
 */
import {Skeleton, Bone, Object3D, SkinnedMesh } from "three";

export class PackageSkeleton{
    // 场景内所有骨骼的map
    private boneMap = new Map<string,Bone>();
    // 场景内所有骨架的map <skeletonUuid:string,skeleton:Skeleton>
    private skeletonsMap  = new Map<string, Skeleton>();
    // 骨架未对应上的骨骼 <boneUuid:string,skeleton:Skeleton[]>
    private unMatchBoneMap  = new Map<string, Skeleton[]>();

    constructor() {
    }

    addBones(bones:Bone[]){
        bones.forEach(bone => {
            if(this.boneMap.has(bone.uuid)) return;

            this.boneMap.set(bone.uuid,bone);

            if(this.unMatchBoneMap.has(bone.uuid)){
                const skeletons = this.unMatchBoneMap.get(bone.uuid) as Skeleton[];

                skeletons.forEach(skeleton => {
                    skeleton.bones.push(bone);

                    // 骨骼找到一个替换一个loader.parse时对应骨骼（Bone）还未加载，生成的空骨骼
                    const d = skeleton.bones.findIndex(bone => bone.userData.waitDelete);
                    if(d === -1) return;
                    skeleton.bones.splice(d,1);
                })

                this.unMatchBoneMap.delete(bone.uuid);
            }
        })
    }

    handleSkeletons(skeletons,group:Object3D){
        skeletons.forEach(skeleton => {
            if(this.skeletonsMap.has(skeleton.uuid)) return;

            let skinnedMesh;
            group.traverse((m:SkinnedMesh )=> {
                if(!m.skeleton?.uuid) return;

                if(m.skeleton.uuid === skeleton.uuid){
                    skinnedMesh = m;
                }
            })
            if(!skinnedMesh) return;

            // 此骨架的原骨骼（Bone）uuid数组
            const bonesUuid:string[] = skeleton.bones;

            // 对比skinnedMesh.skeleton.bones 和 skeleton.bones
            for(let i  = skinnedMesh.skeleton.bones.length;i > 0;i--){
                const bone = skinnedMesh.skeleton.bones[i  - 1];
                const u = bonesUuid.indexOf(bone.uuid);

                if(u === -1){
                    // 和原数组没匹配上，说明此骨骼不是原骨骼，是loader.parse时对应骨骼（Bone）还未加载，生成的新的空骨骼
                    // 但不能直接从skeleton中删除，需要之后找到对应骨骼一个一个替换
                    bone.userData.waitDelete = true;
                }else{
                    bonesUuid.splice(u,1);
                }
            }

            if(bonesUuid.length > 0){
                // 在已存储的骨骼中寻找
                for(let i = bonesUuid.length;i > 0;i--){
                    if(this.boneMap.has(bonesUuid[i])){
                        skinnedMesh.skeleton.bones.push(<Bone>this.boneMap.get(bonesUuid[i]));

                        bonesUuid.splice(i,1);
                    }
                }

                bonesUuid.forEach(uuid => {
                    const skeletons = this.unMatchBoneMap.get(uuid) || [];
                    skeletons.push(skinnedMesh.skeleton);
                    this.unMatchBoneMap.set(uuid,skeletons);
                })
            }

            this.skeletonsMap.set(skeleton.uuid,skinnedMesh.skeleton);
        })
    }

    clear(){
        this.boneMap.clear();
        this.skeletonsMap.clear();
        this.unMatchBoneMap.clear();
    }
}