var m, _, afState = {arrLen: {}, form: {}}

function autoForm(opts){return {view: function(){
  function normal(name){return name.replace(/\d/g, '$')}
  function ors(array){return array.filter(Boolean)[0]}
  function dateValue(timestamp, hour){
    var date = new Date(timestamp),
    dateStamp = [date.getFullYear(), date.getMonth()+1, date.getDate()].join('-'),
    zeros = function(num){return num < 10 ? '0'+num : num},
    hourStamp = 'T'+zeros(date.getHours())+':'+zeros(date.getMinutes())
    return !hour ? dateStamp : dateStamp+hourStamp
  }

  function linearize(obj){
    function recurse(doc){
      var value = doc[_.keys(doc)[0]]
      return typeof(value) === 'object' ? _.map(value, function(val, key){
        return recurse({[_.keys(doc)[0]+'.'+key]: val})
      }) : doc
    }
    return _.fromPairs(
      _.flattenDeep(recurse({doc: obj}))
      .map(function(i){return [_.keys(i)[0].substr(4), _.values(i)[0]]})
    )
  }

  afState.form[opts.id] = opts.doc ? linearize(opts.doc) : afState.form[opts.id]

  var attr = {
    form: {
      id: opts.id,
      onchange: function(e){
        e.redraw = false
        afState.form[opts.id] = afState.form[opts.id] || {}
        afState.form[opts.id][e.target.name] = e.target.value
      },
      onsubmit: function(e){
        e.preventDefault()
        afState.form[opts.id] = opts.autoReset && null
        var submit = () => opts.action(
          _.filter(e.target, function(i){return i.name && i.value})
          .map(function(obj){
            var type = opts.schema[normal(obj.name)].type
            return _.reduceRight(
              obj.name.split('.'),
              function(res, inc){return {[inc]: res}},
              obj.value && [ // value conversion
                ((type === String) && obj.value),
                ((type === Number) && +(obj.value)),
                ((type === Date) && (new Date(obj.value)).getTime())
              ].filter(function(i){return !!i})[0]
            )
          }).reduce(function(res, inc){
            function recursive(inc){return ors([
              typeof(inc) === 'object' && ors([
                +_.keys(inc)[0]+1 &&
                _.range(+_.keys(inc)[0]+1).map(function(i){
                  return i === +_.keys(inc)[0] ?
                  recursive(_.values(inc)[0]) : undefined
                }),
                {[_.keys(inc)[0]]: recursive(_.values(inc)[0])}
              ]), inc
            ])}
            return _.merge(res, recursive(inc))
          }, {})
        )
        !opts.confirmMessage ? submit() : confirm(opts.confirmMessage) && submit()
      }
    },
    arrLen: function(name, type){return {onclick: function(){
      afState.arrLen[name] = afState.arrLen[name] || 0
      afState.arrLen[name] += ({inc: 1, dec: -1})[type]
    }}},
    label: function(name, schema){return m('label.label',
      m('span', schema.label || _.startCase(name)),
      m('span', m('b.has-text-danger', !schema.optional && ' *'))
    )}
  }

  function inputTypes(name, schema){return {
    hidden: function(){return m('input.input', {
      type: 'hidden', name: !schema.exclude ? name : '',
      value: schema.autoValue &&
        schema.autoValue(name, afState.form[opts.id], opts)
    })},
    readonly: function(){return m('.field',
      attr.label(name, schema),
      m('input.input', {
        readonly: true, name: !schema.exclude ? name : '',
        value: schema.autoValue(name, afState.form[opts.id], opts)
      })
    )},
    "datetime-local": function(){return m('.field',
      attr.label(name, schema),
      m('.control', m('input.input', {
        type: 'datetime-local',
        name: !schema.exclude ? name: '',
        required: !schema.optional,
        value: dateValue(_.get(afState.form, [opts.id, name]), true),
      }))
    )},
    textarea: function(){return m('.field',
      attr.label(name, schema),
      m('textarea.textarea', {
        name: !schema.exclude ? name : '',
        required: !schema.optional,
        value: _.get(afState.form, [opts.id, name]),
        placeholder: _.get(schema, 'autoform.placeholder'),
        rows: _.get(schema, 'autoform.rows') || 6,
      })
    )},
    password: function(){return m('.field',
      attr.label(name, schema), m('input.input', {
        name: !schema.exclude ? name : '',
        required: !schema.optional, type: 'password',
        placeholder: _.get(schema, 'autoform.placeholder')
      })
    )},
    select: function(){return m('.field.is-expanded',
      attr.label(name, schema),
      m('.select.is-fullwidth', m('select',
        {
          name: !schema.exclude ? name : '',
          required: !schema.optional,
          value: _.get(afState.form, [opts.id, name])
        },
        m('option', {value: ''}, '-'),
        schema.autoform.options(name, afState.form[opts.id])
        .map(function(i){return m('option', {
          value: i.value,
          selected: !!_.get(afState.form, [opts.id, name])
        }, i.label)})
      )),
      m('p.help', _.get(schema, 'autoform.help'))
    )},
    standard: function(){return ors([
      schema.type === Object && m('.box',
        attr.label(name, schema),
        _.map(opts.schema, function(val, key){
          return _.merge(val, {name: key})
        }).filter(function(i){
          function getLen(str){return _.size(_.split(str, '.'))};
          return _.every([
            _.includes(i.name, normal(name)+'.'),
            getLen(name)+1 === getLen(i.name)
          ])
        }).map(function(i){
          var childSchema = opts.schema[normal(i.name)];
          return inputTypes(
            name+'.'+_.last(i.name.split('.')), childSchema
          )[_.get(childSchema, 'autoform.type') || 'standard']()
        }),
        m('p.help', _.get(schema, 'autoform.help'))
      ),

      schema.type === Array && m('.box',
        attr.label(name, schema),
        m('tags',
          m('.tag.is-success', attr.arrLen(name, 'inc'), 'Add+'),
          m('.tag.is-warning', attr.arrLen(name, 'dec'), 'Rem-'),
          m('.tag', afState.arrLen[name]),
        ),
        _.range(afState.arrLen[name]).map(function(i){
          var childSchema = opts.schema[normal(name)+'.$']
          return inputTypes(name+'.'+i, childSchema)
          [_.get(childSchema, 'autoform.type') || 'standard']()
        }),
        m('p.help', _.get(schema, 'autoform.help'))
      ),

      m('.field',
        attr.label(name, schema),
        m('.control', m('input.input', {
          step: 'any', name: !schema.exclude ? name : '',
          placeholder: _.get(schema, 'autoform.placeholder'),
          value: ors([
            schema.autoValue &&
            schema.autoValue(name, afState.form[opts.id], opts),
            schema.type === Date &&
            dateValue(_.get(afState.form, [opts.id, name])),
            _.get(afState.form, [opts.id, name])
          ]),
          required: !schema.optional, pattern: schema.regExp,
          min: schema.minMax && schema.minMax(name, afState.form[opts.id])[0],
          max: schema.minMax && schema.minMax(name, afState.form[opts.id])[1],
          onchange: schema.autoRedraw && function(){},
          type: _.get(
            [[Date, 'date'], [String, 'text'], [Number, 'number']]
            .filter(function(i){return i[0] === schema.type})[0], '1'
          ),
        })),
        m('p.help', _.get(schema, 'autoform.help'))
      )
    ])},
  }}

  return m('form', attr.form,
    _.map(opts.schema, function(val, key){
      return !_.includes(key, '.') && inputTypes(key, val)[
        _.get(val, 'autoform.type') || 'standard'
      ]()
    }),
    m('.row', m('button.button',
      _.assign({type: 'submit', class: 'is-info'}, opts.submit),
      (opts.submit && opts.submit.value) || 'Submit'
    ))
  )
}}}
