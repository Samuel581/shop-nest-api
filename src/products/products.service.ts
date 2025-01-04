import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource
  ){}


  async create(createProductDto: CreateProductDto): Promise<Product | null> {
    try {
      const {images = [], ...productDetails} = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map(image => this.productImageRepository.create({ url: image}))
      });
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(): Promise<Product[]> {
    const products = this.productRepository.find({
      relations: ['images']
    });
    return products;
  }

  async findOne(id: string): Promise<Product | null> {
    try {
      return this.checkIfProductExists(id);
    } catch (error) {
      this.handleExceptions(error);
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto;
    const product = await this.productRepository.preload({ id,...toUpdate })

    //Create queryrunner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if(!product) throw new NotFoundException('Product not found');
    try {
      if(images){
        await queryRunner.manager.delete(ProductImage,{ product: {id} })
        product.images = images.map( image => this.productImageRepository.create({ url: image}) );
      }

      await queryRunner.manager.save( product );
      //await this.productRepository.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleExceptions(error);
    }
    
  }

  async remove(id: string) {
    try {
      await this.checkIfProductExists(id);
      return await this.productRepository.delete(id);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  private handleExceptions(error: any){
    if(error.code === '23505'){
      throw new BadRequestException(error.detail);
    }
    //this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, please check log')
  }

  private async checkIfProductExists(id: string): Promise<Product>{
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images']
    });
      if(product){
        return await product;
      }
      else{
        throw new BadRequestException(`Product with the id ${id} not found in the database`);
      }
  }
}
