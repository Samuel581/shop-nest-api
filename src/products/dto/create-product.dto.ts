import { IsArray, IsIn, IsNumber, IsOptional, IsPositive, IsString, MinLength, Matches } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @MinLength(1)
    title: string;

    @IsNumber()
    @IsPositive()
    price: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    @Matches(/^[a-zA-Z0-9-]+$/, {
        message: 'Slug must contain only letters, numbers and hyphens'
    })
    slug?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    stock?: number;

    @IsArray()
    @IsString({ each: true })
    @IsIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'], { each: true })
    sizes: string[];

    @IsString()
    @IsIn(['men', 'women', 'kid', 'unisex'])
    gender: string;

    
}