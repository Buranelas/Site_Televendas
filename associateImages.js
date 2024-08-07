const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos
const jsonFilePath = path.join(__dirname, 'products.json');

// Caminho base para as imagens armazenadas no servidor de arquivos
const baseImagePath = '\\\\192.168.110.252\\Unidade - 10\\Dep_Marketing\\2- DEPARTAMENTO DE MARKETING - CRIAÇÃO\\11 - Banco de Imagens\\Produtos Supermercado';
const baseImageUrl = 'http://192.168.110.252/Unidade - 10/Dep_Marketing/2- DEPARTAMENTO DE MARKETING - CRIAÇÃO/11 - Banco de Imagens/Produtos Supermercado';

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

// Função recursiva para obter todos os arquivos de uma pasta e subpastas
function getAllFiles(dirPath, arrayOfFiles) {
    console.log(`Verificando diretório: ${dirPath}`);
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else {
            arrayOfFiles.push(filePath);
        }
    });

    return arrayOfFiles;
}

// Função principal para associar URLs de imagens aos produtos
function associateImagesToProducts() {
    const products = readProductsJson();
    const imageFiles = getAllFiles(baseImagePath);

    // Verificação de acessibilidade do diretório
    if (imageFiles.length === 0) {
        console.error('Nenhuma imagem encontrada. Verifique o caminho e as permissões do diretório.');
        return;
    } else {
        console.log(`Total de imagens encontradas: ${imageFiles.length}`);
    }

    // Listar todos os arquivos de imagem encontrados (depuração)
    imageFiles.forEach(file => {
        console.log(`Arquivo de imagem encontrado: ${file}`);
    });

    products.forEach(product => {
        console.log(`Verificando produto: ${product["Descrição"]}`);
        if (!product.Imagem || product.Imagem === '') {
            const imageFile = imageFiles.find(file => {
                const fileNameWithoutExtension = path.parse(file).name.toLowerCase();
                const productName = product["Descrição"].replace(/\s+/g, '_').toLowerCase();
                console.log(`Comparando: ${fileNameWithoutExtension} com ${productName}`);
                return fileNameWithoutExtension === productName;
            });

            if (imageFile) {
                const relativePath = path.relative(baseImagePath, imageFile);
                product.Imagem = `${baseImageUrl}/${encodeURIComponent(relativePath).replace(/%5C/g, '/')}`;
                console.log(`Imagem encontrada para o produto: ${product["Descrição"]} - Caminho: ${product.Imagem}`);
            } else {
                console.warn(`Imagem não encontrada para o produto: ${product["Descrição"]}`);
            }
        }
    });

    saveProductsJson(products);
}

try {
    associateImagesToProducts();
    console.log('URLs das imagens associadas com sucesso!');
} catch (error) {
    console.error('Erro ao acessar o servidor de arquivos:', error);
}
