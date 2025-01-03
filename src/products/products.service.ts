import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Param } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ){}


  async create(createProductDto: CreateProductDto): Promise<Product | null> {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(): Promise<Product[]> {
    const products = this.productRepository.find();
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
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto
    })
    if(!product) throw new NotFoundException('Product not found');
    await this.productRepository.save(product);
    return product;
  }

  async remove(id: string) {
    try {
      const product = await this.checkIfProductExists(id);
      return await this.productRepository.remove(product);
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
    const product = await this.productRepository.findOneBy({id});
      if(product){
        return await product;
      }
      else{
        throw new BadRequestException(`Product with the id ${id} not found in the database`);
      }
  }
}
