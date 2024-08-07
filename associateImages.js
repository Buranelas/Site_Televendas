const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos
const jsonFilePath = path.join(__dirname, 'products.json');
const imagesFolderPath = path.join(__dirname, 'Produtos Supermercado');

// Função para ler o JSON dos produtos
function readProductsJson() {
    const rawData = fs.readFileSync(jsonFilePath);
    return JSON.parse(rawData);
}

// Função para salvar o JSON atualizado
function saveProductsJson(products) {
    const jsonString = JSON.stringify(products, null, 2);
    fs.writeFileSync(jsonFilePath, jsonString);
}

// Função para obter os nomes dos arquivos de todas as subpastas da pasta de imagens
function getAllImageFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(file => {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllImageFiles(path.join(dirPath, file), arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, file));
        }
    });

    return arrayOfFiles;
}

// Função principal para associar imagens aos produtos
function associateImagesToProducts() {
    const products = readProductsJson();
    const imageFiles = getAllImageFiles(imagesFolderPath);

    products.forEach(product => {
        // Tenta encontrar uma imagem correspondente
        const imageFile = imageFiles.find(file => {
            const fileNameWithoutExtension = path.parse(file).name.toLowerCase();
            return product["Descrição"].toLowerCase().includes(fileNameWithoutExtension);
        });

        // Atualiza o campo "Imagem" do produto
        if (imageFile) {
            product.Imagem = path.relative(__dirname, imageFile).replace(/\\/g, '/');
        } else {
            product.Imagem = ''; // Ou um caminho padrão se não encontrar a imagem
        }
    });

    saveProductsJson(products);
}

associateImagesToProducts();
console.log('Imagens associadas com sucesso!');
