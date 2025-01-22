import { Produto } from "@prisma/client";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProdutoDto implements Produto {
    @IsNumber()
    @IsOptional()
    id: number;

    @IsString()
    @IsNotEmpty()
    nome: string;
    descricao: string | null;
    preco: number;
    dataCriacao: Date;
    categoriaId: number;
}
