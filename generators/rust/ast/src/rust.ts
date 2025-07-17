// Basic Rust AST types
export interface RustFile {
    name: string;
    contents: string;
}

export interface RustStruct {
    name: string;
    fields: RustField[];
    derives: string[];
    visibility: RustVisibility;
}

export interface RustField {
    name: string;
    type: RustType;
    optional: boolean;
    visibility: RustVisibility;
}

export interface RustType {
    name: string;
    generic?: RustType[];
    isReference?: boolean;
    isMutable?: boolean;
}

export interface RustEnum {
    name: string;
    variants: RustEnumVariant[];
    derives: string[];
    visibility: RustVisibility;
}

export interface RustEnumVariant {
    name: string;
    fields?: RustField[];
    discriminant?: string;
}

export interface RustImpl {
    struct: string;
    methods: RustMethod[];
    trait?: string;
}

export interface RustMethod {
    name: string;
    parameters: RustParameter[];
    returnType?: RustType;
    body: string;
    visibility: RustVisibility;
    isAsync?: boolean;
}

export interface RustParameter {
    name: string;
    type: RustType;
    isSelf?: boolean;
    isMutable?: boolean;
}

export interface RustModule {
    name: string;
    items: RustItem[];
    visibility: RustVisibility;
}

export type RustItem = RustStruct | RustEnum | RustImpl | RustFunction;

export interface RustFunction {
    name: string;
    parameters: RustParameter[];
    returnType?: RustType;
    body: string;
    visibility: RustVisibility;
    isAsync?: boolean;
}

export enum RustVisibility {
    Private = "private",
    Public = "pub",
    PublicCrate = "pub(crate)",
    PublicSuper = "pub(super)"
}

// Rust code generation utilities
export class RustCodeGenerator {
    generateStruct(struct: RustStruct): string {
        const derives = struct.derives.length > 0 ? `#[derive(${struct.derives.join(', ')})]\n` : '';
        const visibility = struct.visibility === RustVisibility.Private ? '' : `${struct.visibility} `;
        const fields = struct.fields.map(field => {
            const fieldVisibility = field.visibility === RustVisibility.Private ? '' : `${field.visibility} `;
            return `    ${fieldVisibility}${field.name}: ${this.generateType(field.type)},`;
        }).join('\n');
        
        return `${derives}${visibility}struct ${struct.name} {\n${fields}\n}`;
    }
    
    generateEnum(enum_: RustEnum): string {
        const derives = enum_.derives.length > 0 ? `#[derive(${enum_.derives.join(', ')})]\n` : '';
        const visibility = enum_.visibility === RustVisibility.Private ? '' : `${enum_.visibility} `;
        const variants = enum_.variants.map(variant => {
            if (variant.fields && variant.fields.length > 0) {
                const fields = variant.fields.map(field => 
                    `${field.name}: ${this.generateType(field.type)}`
                ).join(', ');
                return `    ${variant.name} { ${fields} }`;
            }
            return `    ${variant.name}`;
        }).join(',\n');
        
        return `${derives}${visibility}enum ${enum_.name} {\n${variants}\n}`;
    }
    
    generateImpl(impl: RustImpl): string {
        const traitImpl = impl.trait ? ` ${impl.trait} for` : '';
        const methods = impl.methods.map(method => this.generateMethod(method)).join('\n\n');
        
        return `impl${traitImpl} ${impl.struct} {\n${methods}\n}`;
    }
    
    generateMethod(method: RustMethod): string {
        const visibility = method.visibility === RustVisibility.Private ? '' : `${method.visibility} `;
        const asyncKeyword = method.isAsync ? 'async ' : '';
        const params = method.parameters.map(param => this.generateParameter(param)).join(', ');
        const returnType = method.returnType ? ` -> ${this.generateType(method.returnType)}` : '';
        
        return `    ${visibility}${asyncKeyword}fn ${method.name}(${params})${returnType} {\n${method.body}\n    }`;
    }
    
    generateParameter(param: RustParameter): string {
        if (param.isSelf) {
            return param.isMutable ? '&mut self' : '&self';
        }
        return `${param.name}: ${this.generateType(param.type)}`;
    }
    
    generateType(type: RustType): string {
        let typeStr = type.name;
        
        if (type.generic && type.generic.length > 0) {
            const generics = type.generic.map(g => this.generateType(g)).join(', ');
            typeStr = `${typeStr}<${generics}>`;
        }
        
        if (type.isReference) {
            typeStr = `&${type.isMutable ? 'mut ' : ''}${typeStr}`;
        }
        
        return typeStr;
    }
    
    generateModule(module: RustModule): string {
        const visibility = module.visibility === RustVisibility.Private ? '' : `${module.visibility} `;
        const items = module.items.map(item => this.generateItem(item)).join('\n\n');
        
        return `${visibility}mod ${module.name} {\n${items}\n}`;
    }
    
    generateItem(item: RustItem): string {
        if ('fields' in item && 'variants' in item) {
            // This is a RustEnum
            return this.generateEnum(item as RustEnum);
        } else if ('fields' in item) {
            // This is a RustStruct
            return this.generateStruct(item as RustStruct);
        } else if ('struct' in item) {
            // This is a RustImpl
            return this.generateImpl(item as RustImpl);
        } else {
            // This is a RustFunction
            return this.generateFunction(item as RustFunction);
        }
    }
    
    generateFunction(func: RustFunction): string {
        const visibility = func.visibility === RustVisibility.Private ? '' : `${func.visibility} `;
        const asyncKeyword = func.isAsync ? 'async ' : '';
        const params = func.parameters.map(param => this.generateParameter(param)).join(', ');
        const returnType = func.returnType ? ` -> ${this.generateType(func.returnType)}` : '';
        
        return `${visibility}${asyncKeyword}fn ${func.name}(${params})${returnType} {\n${func.body}\n}`;
    }
}

// Helper functions for creating common Rust types
export function createRustType(name: string, generics?: RustType[]): RustType {
    return {
        name,
        generic: generics
    };
}

export function createStringType(): RustType {
    return createRustType('String');
}

export function createStrType(): RustType {
    return createRustType('&str');
}

export function createOptionalType(inner: RustType): RustType {
    return createRustType('Option', [inner]);
}

export function createResultType(ok: RustType, err: RustType): RustType {
    return createRustType('Result', [ok, err]);
}

export function createVecType(inner: RustType): RustType {
    return createRustType('Vec', [inner]);
} 