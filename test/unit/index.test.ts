import * as assert from 'assert'
import * as sinon from 'sinon'
import * as Index from '../../src/index'
import * as Typescript from '../../src/typescript'
import {Database} from '../../src/schema'

describe('index', () => {
    const typedTableSandbox = sinon.sandbox.create()
    const db = {
        getTableTypes: typedTableSandbox.stub(),
        query: typedTableSandbox.stub(),
        getEnumTypes: typedTableSandbox.stub(),
        getTableDefinition: typedTableSandbox.stub(),
        getSchemaTables: typedTableSandbox.stub()
    } as Database
    const tsReflection = Typescript as any
    const dbReflection = db as any
    before(() => {
        typedTableSandbox.stub(Typescript, 'generateEnumType')
        typedTableSandbox.stub(Typescript, 'generateTableTypes')
        typedTableSandbox.stub(Typescript, 'generateTableInterface')
    })
    beforeEach(() => {
        typedTableSandbox.reset()
    })
    after(() => {
        typedTableSandbox.restore()
    })
    describe('typescriptOfTable', () => {
        it('calls functions with correct params', async () => {
            dbReflection.getTableTypes.returns(Promise.resolve('tableTypes'))
            await Index.typescriptOfTable(db, 'tableName', 'schemaName')
            assert.deepEqual(dbReflection.getTableTypes.getCall(0).args, [
                'tableName',
                'schemaName'
            ])
            assert.deepEqual(tsReflection.generateTableTypes.getCall(0).args, [
                'tableName',
                'tableTypes'
            ])
            assert.deepEqual(tsReflection.generateTableInterface.getCall(0).args, [
                'tableName',
                'tableTypes'
            ])
        })
        it('merges string results', async () => {
            dbReflection.getTableTypes.returns(Promise.resolve('tableTypes'))
            tsReflection.generateTableTypes.returns('generatedTableTypes\n')
            tsReflection.generateTableInterface.returns('generatedTableInterfaces\n')
            const typescriptString = await Index.typescriptOfTable(db, 'tableName', 'schemaName')
            assert.equal(typescriptString, 'generatedTableTypes\ngeneratedTableInterfaces\n')
        })
    })
    describe('extractCommand', () => {
        it('postgres connection', () => {
            const command = Index.extractCommand([
                'node',
                'schemats',
                'generate',
                '-c',
                'postgres://pgUser:pgPassword@localhost/pgtest',
                '-o', 'osm.ts'
            ])
            assert.equal(command, 'generate -c postgres://username:password@localhost/pgtest -o osm.ts')
        })
        it('mysql connection', () => {
            const command = Index.extractCommand([
                'node',
                'schemats',
                'generate',
                '-c',
                'mysql://myUser:myPassword@localhost/mytest',
                '-o', 'osm.ts'
            ])
            assert.equal(command, 'generate -c mysql://username:password@localhost/mytest -o osm.ts')
        })
    })
    describe('typescriptOfSchema', () => {
        it('has namespace', async () => {
            dbReflection.getSchemaTables.returns(Promise.resolve(['tablename']))
            dbReflection.getEnumTypes.returns(Promise.resolve('enumTypes'))
            tsReflection.generateTableTypes.returns('generatedTableTypes\n')
            tsReflection.generateEnumType.returns('generatedEnumTypes\n')
            const tsOfSchema = await Index.typescriptOfSchema(db, 'namespace', [], null, 'testCommand', '2017-04-01')

            assert.deepEqual(dbReflection.getSchemaTables.getCall(0).args[0], 'public')
            assert.deepEqual(dbReflection.getEnumTypes.getCall(0).args[0], 'public')
            assert.deepEqual(tsReflection.generateEnumType.getCall(0).args[0], 'enumTypes')
            assert.deepEqual(tsReflection.generateTableTypes.getCall(0).args[0], 'tablename')
            assert.equal(tsOfSchema,
                '\n' +
                '/* tslint:disable */\n' +
                '/**\n' +
                ' * AUTO-GENERATED FILE @ 2017-04-01 - DO NOT EDIT!\n' +
                ' *\n' +
                ' * This file was generated with schemats node package:\n' +
                ' * $ schemats testCommand\n' +
                ' *\n' +
                ' * Re-run the command above.\n' +
                ' *\n' +
                ' */' +
                '\n' +
                '\n' +
                'export namespace namespace {\n' +
                '    generatedEnumTypes\n' +
                '    generatedTableTypes\n' +
                '    undefined\n' +
                '}\n')
        })
        it('has schema', async () => {
            dbReflection.getSchemaTables.returns(Promise.resolve(['tablename']))
            dbReflection.getEnumTypes.returns(Promise.resolve('enumTypes'))
            tsReflection.generateTableTypes.returns('generatedTableTypes\n')
            tsReflection.generateEnumType.returns('generatedEnumTypes\n')
            const tsOfSchema = await Index.typescriptOfSchema(db, null, [], 'schemaName', 'testCommand', '2017-04-01')

            assert.deepEqual(dbReflection.getSchemaTables.getCall(0).args[0], 'schemaName')
            assert.deepEqual(dbReflection.getEnumTypes.getCall(0).args[0], 'schemaName')
            assert.deepEqual(tsReflection.generateEnumType.getCall(0).args[0], 'enumTypes')
            assert.deepEqual(tsReflection.generateTableTypes.getCall(0).args[0], 'tablename')
            assert.equal(tsOfSchema,
                '\n' +
                '/* tslint:disable */\n' +
                '/**\n' +
                ' * AUTO-GENERATED FILE @ 2017-04-01 - DO NOT EDIT!\n' +
                ' *\n' +
                ' * This file was generated with schemats node package:\n' +
                ' * $ schemats testCommand\n' +
                ' *\n' +
                ' * Re-run the command above.\n' +
                ' *\n' +
                ' */' +
                '\n' +
                '\n' +
                'generatedEnumTypes\n' +
                'generatedTableTypes\n' +
                'undefined\n')
        })
        it('has tables provided', async () => {
            dbReflection.getSchemaTables.returns(Promise.resolve(['tablename']))
            dbReflection.getEnumTypes.returns(Promise.resolve('enumTypes'))
            tsReflection.generateTableTypes.returns('generatedTableTypes\n')
            tsReflection.generateEnumType.returns('generatedEnumTypes\n')
            const tsOfSchema = await Index.typescriptOfSchema(db, null, ['differentTablename'], null, 'testCommand', '2017-04-01')

            assert(!dbReflection.getSchemaTables.called)
            assert.deepEqual(dbReflection.getEnumTypes.getCall(0).args[0], 'public')
            assert.deepEqual(tsReflection.generateEnumType.getCall(0).args[0], 'enumTypes')
            assert.deepEqual(tsReflection.generateTableTypes.getCall(0).args[0], 'differentTablename')
            assert.equal(tsOfSchema,
                '\n' +
                '/* tslint:disable */\n' +
                '/**\n' +
                ' * AUTO-GENERATED FILE @ 2017-04-01 - DO NOT EDIT!\n' +
                ' *\n' +
                ' * This file was generated with schemats node package:\n' +
                ' * $ schemats testCommand\n' +
                ' *\n' +
                ' * Re-run the command above.\n' +
                ' *\n' +
                ' */' +
                '\n' +
                '\n' +
                'generatedEnumTypes\n' +
                'generatedTableTypes\n' +
                'undefined\n')
        })
    })
})
