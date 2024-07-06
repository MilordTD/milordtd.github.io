import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Инициализация 3D сцены
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    alpha: true,
    antialias: true  // Включаем антиалиасинг
});
renderer.setClearColor(0x000000, 0); // Полностью прозрачный фон
renderer.setPixelRatio(window.devicePixelRatio); // Устанавливаем pixel ratio для лучшего качества на дисплеях с высоким DPI
const productGallery = document.querySelector('.product-gallery');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const closeButton = document.getElementsByClassName('close')[0];
renderer.setSize(200, 200);
document.getElementById('book-3d-model').appendChild(renderer.domElement);

// Загрузка 3D модели
const loader = new GLTFLoader();
let currentModel;

let mouseX = 0;
let mouseY = 0;

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) / 100;
    mouseY = (event.clientY - window.innerHeight / 2) / 100;
}

function animate() {
    requestAnimationFrame(animate);
    if (currentModel) {
        currentModel.rotation.y = mouseX * 0.1;
        currentModel.rotation.x = mouseY * 0.1;
    }
    renderer.render(scene, camera);
}

document.addEventListener('mousemove', onDocumentMouseMove, false);

function loadModel(modelUrl) {
    if (currentModel) {
        scene.remove(currentModel);
    }

    loader.load(modelUrl, (gltf) => {
        currentModel = gltf.scene;
        
        // Масштабируем модель до высоты 150px (было 6)
        const box = new THREE.Box3().setFromObject(currentModel);
        const height = box.max.y - box.min.y;
        const scale = 150 / height;
        currentModel.scale.set(scale, scale, scale);
        
        scene.add(currentModel);
        
        // Настройка камеры и освещения
        camera.position.z = 5;
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
    }, undefined, (error) => {
        console.error('An error happened', error);
    });
}

// Остальной код файла остается без изменений