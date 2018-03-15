using UnityEngine;
using UnityEditor;
using System.IO;
using System;

class GeneralImportSettings : AssetPostprocessor
{
   void OnPreprocessModel(){
		ModelImporter modImport = assetImporter as ModelImporter;

		if (modImport.assetPath.Contains ("Colliders"))
			modImport.addCollider = true;

		if (modImport.assetPath.Contains ("NoOptimization"))
			modImport.optimizeMesh = false;

        if (modImport.assetPath.Contains (".obj")) {
                modImport.importMaterials = true;
           		Debug.Log("PP:" + modImport.assetPath);
           		string[] linesBefore = System.IO.File.ReadAllLines(modImport.assetPath + ".meta");
           		//System.IO.File.Delete(modImport.assetPath + ".meta");
           		Debug.Log("MM:" + linesBefore[1]);
        }
	}

	void OnPreprocessTexture()
	{
		TextureImporter textureImporter = (TextureImporter)assetImporter;
		if (assetPath.Contains ("_hdpi")) {
			textureImporter.compressionQuality = 100;
			textureImporter.textureCompression = TextureImporterCompression.CompressedHQ;
			textureImporter.maxTextureSize = 8192;
		} else if (assetPath.Contains ("_ndpi")) {
			textureImporter.compressionQuality = 95;
			textureImporter.textureCompression = TextureImporterCompression.Compressed;
			textureImporter.maxTextureSize = 2048;
		} else if (assetPath.Contains ("_ldpi")) {
			textureImporter.compressionQuality = 90;
			textureImporter.textureCompression = TextureImporterCompression.CompressedLQ;
			textureImporter.maxTextureSize = 256;
		}


		if (assetPath.Contains ("_sprite")) {
        	textureImporter.textureType = TextureImporterType.Sprite;
        	textureImporter.spriteImportMode = SpriteImportMode.Single;

        }
	}


	static void OnPostprocessAllAssets(string[] importedAssets, string[] deletedAssets, string[] movedAssets, string[] movedFromAssetPaths){
		string[] assetPaths = AssetDatabase.GetAllAssetPaths();
		foreach (string path in assetPaths)
		{

            Material mat = AssetDatabase.LoadAssetAtPath(path, typeof(Material)) as Material;
            if (mat) {
                if (path.Contains ("NoGlossy")) {
                    mat.SetFloat ("_Glossiness", 0);
                } else if (path.Contains ("TwoSided")) {
                    mat.shader = Shader.Find ("Standard (Two Sided)");
                }
            }

             Sprite sprite = AssetDatabase.LoadAssetAtPath<Sprite>(path);

             if(sprite){
                Debug.Log(sprite);

             }


		}


	}
}